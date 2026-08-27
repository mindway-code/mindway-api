import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const prisma: any = {
  familyMember: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
  $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
};

jest.unstable_mockModule(fileURLToPath(new URL("../../../../src/infra/database/prisma/client.ts", import.meta.url)), () => ({ prisma }));

const repo = await import("../../../../src/infra/database/repositories/familyMembers.repository.js");

describe("repositories: familyMembers", () => {
  beforeEach(() => {
    Object.values(prisma.familyMember).forEach((fn: any) => fn.mockReset());
    prisma.$transaction.mockClear();
  });

  it("listFamilyMembers uses $transaction", async () => {
    prisma.familyMember.findMany.mockResolvedValue([]);
    prisma.familyMember.count.mockResolvedValue(0);
    await repo.listFamilyMembers({ skip: 0, take: 10 } as any);
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});

