import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const prisma: any = {
  socialNetworkUser: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
  $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
};

jest.unstable_mockModule(fileURLToPath(new URL("../../../../src/infra/database/prisma/client.ts", import.meta.url)), () => ({ prisma }));

const repo = await import("../../../../src/infra/database/repositories/socialNetworkUsers.repository.js");

describe("repositories: socialNetworkUsers", () => {
  beforeEach(() => {
    Object.values(prisma.socialNetworkUser).forEach((fn: any) => fn.mockReset());
    prisma.$transaction.mockClear();
  });

  it("isSocialNetworkMember returns boolean based on findUnique", async () => {
    prisma.socialNetworkUser.findFirst.mockResolvedValue({ id: "x" });
    await expect(repo.isSocialNetworkMember("sn1", "u1")).resolves.toBe(true);
  });
});
