import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { prisma } from "../../src/infra/database/prisma/client.js";
import {
  createLocalUser,
  createRefreshTokenRow,
  findActiveRefreshTokensByUserId,
  findAuthUserByEmail,
  revokeRefreshTokenById,
} from "../../src/infra/database/repositories/auth.repository.js";

const createdUserIds: string[] = [];

function assertSafeTestDatabase() {
  if (process.env.RUN_DATABASE_TESTS !== "true") {
    throw new Error("Database tests require RUN_DATABASE_TESTS=true");
  }

  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "postgres-test"]);
  const databaseName = databaseUrl.pathname.replace(/^\//, "");

  if (!localHosts.has(databaseUrl.hostname) || !databaseName.endsWith("_test")) {
    throw new Error("Refusing to run database tests outside a local *_test database");
  }
}

describe("database integration: auth repository", () => {
  beforeAll(async () => {
    assertSafeTestDatabase();
    await prisma.$connect();
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await prisma.$disconnect();
  });

  it("persists and reads the selected authentication fields", async () => {
    const email = `db-contract-${crypto.randomUUID()}@example.com`;
    const created = await createLocalUser({
      name: "Database Contract",
      email,
      passwordHash: "stored-hash",
      role: "common",
      provider: "local",
      googleId: null,
    });
    createdUserIds.push(created.id);

    await expect(findAuthUserByEmail(email)).resolves.toEqual(
      expect.objectContaining({
        id: created.id,
        email,
        passwordHash: "stored-hash",
        role: "common",
      }),
    );
  });

  it("returns only active refresh tokens and removes a token after revocation", async () => {
    const email = `db-refresh-${crypto.randomUUID()}@example.com`;
    const user = await createLocalUser({
      name: "Refresh Contract",
      email,
      passwordHash: "stored-hash",
      role: "common",
      provider: "local",
      googleId: null,
    });
    createdUserIds.push(user.id);

    const active = await createRefreshTokenRow({
      userId: user.id,
      tokenHash: `token-${crypto.randomUUID()}`,
      expiresAt: new Date(Date.now() + 60_000),
    });
    await createRefreshTokenRow({
      userId: user.id,
      tokenHash: `expired-${crypto.randomUUID()}`,
      expiresAt: new Date(Date.now() - 60_000),
    });

    await expect(findActiveRefreshTokensByUserId(user.id)).resolves.toEqual([
      expect.objectContaining({ id: active.id }),
    ]);

    await revokeRefreshTokenById(active.id);
    await expect(findActiveRefreshTokensByUserId(user.id)).resolves.toEqual([]);
  });
});
