import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const prisma = {
  user: { findUnique: jest.fn(), create: jest.fn() },
  refreshToken: { create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
};

jest.unstable_mockModule(
  fileURLToPath(new URL("../../../../src/infra/database/prisma/client.ts", import.meta.url)),
  () => ({ prisma }),
);

const repo = await import("../../../../src/infra/database/repositories/auth.repository.js");

describe("repositories: auth", () => {
  beforeEach(() => {
    prisma.user.findUnique.mockReset();
    prisma.user.create.mockReset();
    prisma.refreshToken.create.mockReset();
    prisma.refreshToken.findMany.mockReset();
    prisma.refreshToken.update.mockReset();
  });

  it("findAuthUserByEmail queries prisma.user.findUnique", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1" });
    await repo.findAuthUserByEmail("a@a.com");
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { email: "a@a.com" } }));
  });

  it("createLocalUser inserts prisma.user.create", async () => {
    prisma.user.create.mockResolvedValue({ id: "u1", role: "common" });
    await repo.createLocalUser({ name: "A", email: "a@a.com", passwordHash: "h", role: "common", provider: "local" } as any);
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ email: "a@a.com" }) }));
  });

  it("findActiveRefreshTokensByUserId filters revokedAt/expiresAt", async () => {
    prisma.refreshToken.findMany.mockResolvedValue([]);
    await repo.findActiveRefreshTokensByUserId("u1");
    expect(prisma.refreshToken.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "u1", revokedAt: null, expiresAt: expect.any(Object) }),
      }),
    );
  });
});
