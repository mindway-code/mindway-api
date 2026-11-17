import { createHash } from "node:crypto";
import type { RedisClientType } from "redis";
import type { EncryptedSecret } from "../../utils/crypto/secretEncryption.js";
import { getStrictRedisClient } from "./redis.js";

export type PendingTotpEnrollment = {
  userId: string;
  encryptedSecret: EncryptedSecret;
};

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

function enrollmentKey(enrollmentId: string): string {
  return `mfa:enrollment:${enrollmentId}`;
}

function attemptKey(userId: string, ip: string): string {
  const ipHash = createHash("sha256").update(ip || "unknown", "utf8").digest("hex");
  return `mfa:attempt:${userId}:${ipHash}`;
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

  return {
    storePendingEnrollment,
    loadPendingEnrollment,
    deletePendingEnrollment,
    getFailedAttemptCount,
    incrementFailedAttempt,
    clearFailedAttempts,
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
} = securityStore;

export default securityStore;
