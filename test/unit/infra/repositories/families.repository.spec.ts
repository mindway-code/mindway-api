import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const prisma: any = {
  family: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
  $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
};

jest.unstable_mockModule(fileURLToPath(new URL("../../../../src/infra/database/prisma/client.ts", import.meta.url)), () => ({ prisma }));

const repo = await import("../../../../src/infra/database/repositories/families.repository.js");

describe("repositories: families", () => {
  beforeEach(() => {
    Object.values(prisma.family).forEach((fn: any) => fn.mockReset());
    prisma.$transaction.mockClear();
  });

  it("createFamily writes prisma.family.create", async () => {
    prisma.family.create.mockResolvedValue({ id: "f1" });
    await repo.createFamily({ name: "X" } as any);
    expect(prisma.family.create).toHaveBeenCalledWith(expect.objectContaining({ data: { name: "X" } }));
  });

  it("listFamiliesByUserId uses members filter", async () => {
    prisma.family.findMany.mockResolvedValue([]);
    prisma.family.count.mockResolvedValue(0);
    await repo.listFamiliesByUserId("u1", { skip: 0, take: 10 });
    const arg = prisma.family.findMany.mock.calls[0][0];
    expect(arg.where).toEqual(expect.objectContaining({ members: expect.any(Object) }));
  });
});

