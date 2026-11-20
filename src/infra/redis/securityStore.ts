import { createHash, randomBytes } from "node:crypto";
import type { RedisClientType } from "redis";
import type { EncryptedSecret } from "../../utils/crypto/secretEncryption.js";
import { getStrictRedisClient } from "./redis.js";

export type PendingTotpEnrollment = {
  userId: string;
  encryptedSecret: EncryptedSecret;
};

export const STEP_UP_ACTIONS = [
  "report.validate",
  "report.validation.revoke",
  "mfa.disable",
  "mfa.recovery_codes.regenerate",
  "account.delete",
] as const;

export type StepUpAction = (typeof STEP_UP_ACTIONS)[number];
export type StepUpResourceType = "reportRevision" | "account" | "user";
export type StepUpMethod = "TOTP" | "RECOVERY_CODE";

export type StepUpGrant = {
  userId: string;
  action: StepUpAction;
  resourceType: StepUpResourceType;
  resourceId: string;
  method: StepUpMethod;
  factorId: string | null;
  issuedAt: string;
  expiresAt: string;
};

type StoredStepUpGrant = StepUpGrant & {
  consumedAt?: string;
  consumedIdempotencyKey?: string;
};

export type ConsumeStepUpGrantResult =
  | { status: "CONSUMED" | "IDEMPOTENT_REPLAY"; grant: StepUpGrant }
  | { status: "INVALID" | "EXPIRED" | "ALREADY_USED" | "SCOPE_MISMATCH" };

type SecurityRedisClient = Pick<RedisClientType, "set" | "get" | "del" | "eval">;

export type SecurityStoreDeps = {
  getClient: () => Promise<SecurityRedisClient>;
};

export class SecurityStoreUnavailableError extends Error {
  constructor() {
    super("Security state is unavailable");
    this.name = "SecurityStoreUnavailableError";
  }
}

const ATTEMPT_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
`;

const CONSUME_STEP_UP_SCRIPT = `
local serialized = redis.call('GET', KEYS[1])
if not serialized then
  if redis.call('EXISTS', KEYS[2]) == 1 then
    return cjson.encode({ status = 'EXPIRED' })
  end
  return cjson.encode({ status = 'INVALID' })
end

local grant = cjson.decode(serialized)
if grant.userId ~= ARGV[1] or grant.action ~= ARGV[2] or grant.resourceType ~= ARGV[3] or grant.resourceId ~= ARGV[4] then
  return cjson.encode({ status = 'SCOPE_MISMATCH' })
end

if grant.consumedAt then
  if ARGV[5] ~= '' and grant.consumedIdempotencyKey == ARGV[5] then
    return cjson.encode({ status = 'IDEMPOTENT_REPLAY', grant = grant })
  end
  return cjson.encode({ status = 'ALREADY_USED' })
end

local ttl = redis.call('TTL', KEYS[1])
if ttl <= 0 then
  return cjson.encode({ status = 'EXPIRED' })
end

grant.consumedAt = ARGV[6]
grant.consumedIdempotencyKey = ARGV[5]
redis.call('SET', KEYS[1], cjson.encode(grant), 'EX', ttl)
return cjson.encode({ status = 'CONSUMED', grant = grant })
`;

function enrollmentKey(enrollmentId: string): string {
  return `mfa:enrollment:${enrollmentId}`;
}

function attemptKey(userId: string, ip: string): string {
  const ipHash = createHash("sha256").update(ip || "unknown", "utf8").digest("hex");
  return `mfa:attempt:${userId}:${ipHash}`;
}

function stepUpDigest(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function stepUpGrantKey(digest: string): string {
  return `mfa:step-up:${digest}`;
}

function stepUpGrantMarkerKey(digest: string): string {
  return `mfa:step-up-issued:${digest}`;
}

function isPendingEnrollment(value: unknown): value is PendingTotpEnrollment {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PendingTotpEnrollment>;
  const encrypted = candidate.encryptedSecret;
  return (
    typeof candidate.userId === "string" &&
    !!encrypted &&
    typeof encrypted.ciphertext === "string" &&
    typeof encrypted.iv === "string" &&
    typeof encrypted.authTag === "string" &&
    typeof encrypted.keyVersion === "number"
  );
}

function isStepUpGrant(value: unknown): value is StoredStepUpGrant {
  if (!value || typeof value !== "object") return false;
  const grant = value as Partial<StoredStepUpGrant>;
  return (
    typeof grant.userId === "string" &&
    STEP_UP_ACTIONS.includes(grant.action as StepUpAction) &&
    ["reportRevision", "account", "user"].includes(grant.resourceType ?? "") &&
    typeof grant.resourceId === "string" &&
    ["TOTP", "RECOVERY_CODE"].includes(grant.method ?? "") &&
    (typeof grant.factorId === "string" || grant.factorId === null) &&
    typeof grant.issuedAt === "string" &&
    typeof grant.expiresAt === "string"
  );
}

function publicGrant(grant: StoredStepUpGrant): StepUpGrant {
  const { consumedAt: _consumedAt, consumedIdempotencyKey: _consumedIdempotencyKey, ...safe } = grant;
  return safe;
}

export function makeSecurityStore(deps: SecurityStoreDeps) {
  async function withClient<T>(operation: (client: SecurityRedisClient) => Promise<T>): Promise<T> {
    try {
      const client = await deps.getClient();
      return await operation(client);
    } catch (error) {
      if (error instanceof SecurityStoreUnavailableError) throw error;
      throw new SecurityStoreUnavailableError();
    }
  }

  async function storePendingEnrollment(
    enrollmentId: string,
    enrollment: PendingTotpEnrollment,
    ttlSeconds: number,
  ): Promise<void> {
    await withClient(async (client) => {
      await client.set(enrollmentKey(enrollmentId), JSON.stringify(enrollment), { EX: ttlSeconds });
    });
  }

  async function loadPendingEnrollment(enrollmentId: string): Promise<PendingTotpEnrollment | null> {
    return withClient(async (client) => {
      const serialized = await client.get(enrollmentKey(enrollmentId));
      if (!serialized) return null;
      const parsed: unknown = JSON.parse(serialized);
      if (!isPendingEnrollment(parsed)) throw new SecurityStoreUnavailableError();
      return parsed;
    });
  }

  async function deletePendingEnrollment(enrollmentId: string): Promise<void> {
    await withClient(async (client) => {
      await client.del(enrollmentKey(enrollmentId));
    });
  }

  async function getFailedAttemptCount(userId: string, ip: string): Promise<number> {
    return withClient(async (client) => Number((await client.get(attemptKey(userId, ip))) ?? 0));
  }

  async function incrementFailedAttempt(
    userId: string,
    ip: string,
    windowSeconds: number,
  ): Promise<number> {
    return withClient(async (client) =>
      Number(
        await client.eval(ATTEMPT_SCRIPT, {
          keys: [attemptKey(userId, ip)],
          arguments: [String(windowSeconds)],
        }),
      ),
    );
  }

  async function clearFailedAttempts(userId: string, ip: string): Promise<void> {
    await withClient(async (client) => {
      await client.del(attemptKey(userId, ip));
    });
  }

  async function issueStepUpGrant(grant: StepUpGrant, ttlSeconds: number): Promise<string> {
    return withClient(async (client) => {
      const token = randomBytes(32).toString("base64url");
      const digest = stepUpDigest(token);
      await client.set(stepUpGrantKey(digest), JSON.stringify(grant), { EX: ttlSeconds });
      await client.set(stepUpGrantMarkerKey(digest), "1", { EX: ttlSeconds + 300 });
      return token;
    });
  }

  async function loadStepUpGrant(token: string): Promise<StepUpGrant | null> {
    return withClient(async (client) => {
      const serialized = await client.get(stepUpGrantKey(stepUpDigest(token)));
      if (!serialized) return null;
      const parsed: unknown = JSON.parse(serialized);
      if (!isStepUpGrant(parsed)) throw new SecurityStoreUnavailableError();
      return publicGrant(parsed);
    });
  }

  async function consumeStepUpGrant(params: {
    token: string;
    userId: string;
    action: StepUpAction;
    resourceType: StepUpResourceType;
    resourceId: string;
    idempotencyKey?: string;
  }): Promise<ConsumeStepUpGrantResult> {
    return withClient(async (client) => {
      const digest = stepUpDigest(params.token);
      const raw = await client.eval(CONSUME_STEP_UP_SCRIPT, {
        keys: [stepUpGrantKey(digest), stepUpGrantMarkerKey(digest)],
        arguments: [
          params.userId,
          params.action,
          params.resourceType,
          params.resourceId,
          params.idempotencyKey ?? "",
          new Date().toISOString(),
        ],
      });
      if (typeof raw !== "string") throw new SecurityStoreUnavailableError();
      const parsed = JSON.parse(raw) as { status?: string; grant?: unknown };
      if (parsed.status === "CONSUMED" || parsed.status === "IDEMPOTENT_REPLAY") {
        if (!isStepUpGrant(parsed.grant)) throw new SecurityStoreUnavailableError();
        return { status: parsed.status, grant: publicGrant(parsed.grant) };
      }
      if (["INVALID", "EXPIRED", "ALREADY_USED", "SCOPE_MISMATCH"].includes(parsed.status ?? "")) {
        return { status: parsed.status as "INVALID" | "EXPIRED" | "ALREADY_USED" | "SCOPE_MISMATCH" };
      }
      throw new SecurityStoreUnavailableError();
    });
  }

  return {
    storePendingEnrollment,
    loadPendingEnrollment,
    deletePendingEnrollment,
    getFailedAttemptCount,
    incrementFailedAttempt,
    clearFailedAttempts,
    issueStepUpGrant,
    loadStepUpGrant,
    consumeStepUpGrant,
  };
}

const securityStore = makeSecurityStore({ getClient: getStrictRedisClient });

export const {
  storePendingEnrollment,
  loadPendingEnrollment,
  deletePendingEnrollment,
  getFailedAttemptCount,
  incrementFailedAttempt,
  clearFailedAttempts,
  issueStepUpGrant,
  loadStepUpGrant,
  consumeStepUpGrant,
} = securityStore;

export default securityStore;
