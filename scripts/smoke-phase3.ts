import { randomUUID } from "node:crypto";
import { generate } from "otplib";

const apiUrl = process.env.SMOKE_API_URL ?? "http://localhost:3333/api";
const suffix = randomUUID().slice(0, 8);
const password = `Phase3-${randomUUID()}!`;
let accessToken = "";
let childId = "";

type Envelope<T> = { success: boolean; data: T; error?: { code?: string; message?: string } };

async function call<T>(params: {
  path: string;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  expectedStatus?: number;
}): Promise<Envelope<T>> {
  const response = await fetch(`${apiUrl}${params.path}`, {
    method: params.method ?? "GET",
    headers: {
      ...(params.body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...params.headers,
    },
    ...(params.body ? { body: JSON.stringify(params.body) } : {}),
  });
  const payload = await response.json() as Envelope<T>;
  const expected = params.expectedStatus ?? 200;
  if (response.status !== expected) {
    throw new Error(`${params.method ?? "GET"} ${params.path}: expected ${expected}, received ${response.status} (${payload.error?.code ?? "UNKNOWN"})`);
  }
  return payload;
}

async function waitForNextTotpWindow(): Promise<void> {
  const seconds = 30 - (Math.floor(Date.now() / 1000) % 30) + 1;
  process.stdout.write(`waiting-for-fresh-totp:${seconds}s\n`);
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function main() {
  try {
    const registered = await call<{ accessToken: string }>({
      path: "/auth/register",
      method: "POST",
      body: {
        name: "Phase 3 Smoke",
        email: `phase3-${suffix}@example.test`,
        password,
        confirmPassword: password,
        role: "common",
      },
    });
    accessToken = registered.data.accessToken;
    process.stdout.write("registered\n");

    const child = await call<{ id: string }>({
      path: "/children",
      method: "POST",
      body: { name: `Phase 3 Child ${suffix}`, age: 8, birthDate: "2018-01-01T00:00:00.000Z" },
    });
    childId = child.data.id;

    const enrollment = await call<{ enrollmentId: string; manualSecret: string }>({
      path: "/auth/mfa/totp/enrollments",
      method: "POST",
      body: { currentPassword: password },
    });
    const enrollmentCode = await generate({ secret: enrollment.data.manualSecret });
    const confirmed = await call<{ recoveryCodes: string[] }>({
      path: `/auth/mfa/totp/enrollments/${enrollment.data.enrollmentId}/confirm`,
      method: "POST",
      body: { code: enrollmentCode },
    });
    process.stdout.write("mfa-enrolled\n");

    const created = await call<any>({
      path: `/reports-children/child/${child.data.id}`,
      method: "POST",
      body: { title: "Phase 3 exact revision", behavior: "Initial attested content" },
    });
    const submitted = await call<any>({
      path: `/reports-children/${created.data.id}/submissions`,
      method: "POST",
      body: {},
    });
    if (!submitted.data.capabilities.canValidate) throw new Error("Submitted author did not receive canValidate");
    process.stdout.write("revision-1-submitted\n");

    await waitForNextTotpWindow();
    const code = await generate({ secret: enrollment.data.manualSecret });
    const grant = await call<{ grant: string; expiresIn: number }>({
      path: "/auth/mfa/step-up-grants",
      method: "POST",
      body: {
        method: "TOTP",
        code,
        action: "report.validate",
        resourceType: "reportRevision",
        resourceId: submitted.data.revision.id,
      },
    });
    if (grant.data.expiresIn !== 300) throw new Error("Unexpected grant TTL");

    const firstIdempotencyKey = randomUUID();
    const validationBody = {
      revisionId: submitted.data.revision.id,
      expectedContentHash: submitted.data.revision.contentHash,
      type: "AUTHOR_ATTESTATION",
    };
    const validated = await call<any>({
      path: `/reports-children/${submitted.data.id}/validations`,
      method: "POST",
      headers: { "X-MFA-Proof": grant.data.grant, "Idempotency-Key": firstIdempotencyKey },
      body: validationBody,
    });
    if (validated.data.lifecycle.status !== "VALIDATED" || validated.data.validation?.revisionNumber !== 1) {
      throw new Error("Revision 1 was not published with a validation summary");
    }
    if ("totpFactorId" in validated.data.validation || "requestId" in validated.data.validation) {
      throw new Error("Internal validation metadata leaked into the read model");
    }
    process.stdout.write("revision-1-validated\n");

    await call({
      path: `/reports-children/${submitted.data.id}/validations`,
      method: "POST",
      headers: { "X-MFA-Proof": grant.data.grant, "Idempotency-Key": firstIdempotencyKey },
      body: validationBody,
    });
    process.stdout.write("idempotent-retry-returned-existing-success\n");

    const replay = await call<never>({
      path: `/reports-children/${submitted.data.id}/validations`,
      method: "POST",
      headers: { "X-MFA-Proof": grant.data.grant, "Idempotency-Key": randomUUID() },
      body: validationBody,
      expectedStatus: 409,
    });
    if (replay.error?.code !== "MFA_PROOF_ALREADY_USED") throw new Error("Ordinary proof replay was not rejected");
    process.stdout.write("proof-replay-rejected\n");

    const draft2 = await call<any>({
      path: `/reports-children/${submitted.data.id}/revisions`,
      method: "POST",
      body: {},
    });
    const updated2 = await call<any>({
      path: `/reports-children/${submitted.data.id}/draft`,
      method: "PATCH",
      body: { behavior: "New exact content" },
    });
    const submitted2 = await call<any>({
      path: `/reports-children/${submitted.data.id}/submissions`,
      method: "POST",
      body: {},
    });
    if (draft2.data.revision.revisionNumber !== 2 || updated2.data.revision.revisionNumber !== 2) {
      throw new Error("Revision 2 was not created");
    }

    const wrongRevision = await call<never>({
      path: `/reports-children/${submitted.data.id}/validations`,
      method: "POST",
      headers: { "X-MFA-Proof": grant.data.grant, "Idempotency-Key": randomUUID() },
      body: {
        revisionId: submitted2.data.revision.id,
        expectedContentHash: submitted2.data.revision.contentHash,
        type: "AUTHOR_ATTESTATION",
      },
      expectedStatus: 403,
    });
    if (wrongRevision.error?.code !== "MFA_PROOF_SCOPE_MISMATCH") throw new Error("Cross-revision proof was not rejected");
    process.stdout.write("cross-revision-proof-rejected\n");

    const recoveryGrant = await call<{ grant: string }>({
      path: "/auth/mfa/step-up-grants",
      method: "POST",
      body: {
        method: "RECOVERY_CODE",
        code: confirmed.data.recoveryCodes[0],
        action: "report.validate",
        resourceType: "reportRevision",
        resourceId: submitted2.data.revision.id,
      },
    });
    const validated2 = await call<any>({
      path: `/reports-children/${submitted.data.id}/validations`,
      method: "POST",
      headers: { "X-MFA-Proof": recoveryGrant.data.grant, "Idempotency-Key": randomUUID() },
      body: {
        revisionId: submitted2.data.revision.id,
        expectedContentHash: submitted2.data.revision.contentHash,
        type: "AUTHOR_ATTESTATION",
      },
    });
    const history = await call<any[]>({ path: `/reports-children/${submitted.data.id}/revisions` });
    if (validated2.data.validation?.revisionNumber !== 2 || history.data[0]?.status !== "VALIDATED" || history.data[1]?.status !== "SUPERSEDED") {
      throw new Error("New validation did not supersede the prior publication");
    }
    process.stdout.write("revision-2-validated-and-revision-1-superseded\n");
  } finally {
    if (accessToken) {
      if (childId) await call({ path: `/children/${childId}`, method: "DELETE" });
      await call({ path: "/users/me", method: "DELETE" });
      process.stdout.write("disposable-data-removed\n");
    }
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Phase 3 smoke failed"}\n`);
  process.exitCode = 1;
});
