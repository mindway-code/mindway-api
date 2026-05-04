import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const prisma: any = {
  socialNetwork: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn(), delete: jest.fn() },
  $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
};

jest.unstable_mockModule(fileURLToPath(new URL("../../../../src/infra/database/prisma/client.ts", import.meta.url)), () => ({ prisma }));

const repo = await import("../../../../src/infra/database/repositories/socialNetworks.repository.js");

describe("repositories: socialNetworks", () => {
  beforeEach(() => {
    Object.values(prisma.socialNetwork).forEach((fn: any) => fn.mockReset());
    prisma.$transaction.mockClear();
  });

  it("listSocialNetworks uses $transaction", async () => {
    prisma.socialNetwork.findMany.mockResolvedValue([]);
    prisma.socialNetwork.count.mockResolvedValue(0);
    await repo.listSocialNetworks({ skip: 0, take: 10 });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});

