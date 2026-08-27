import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const prisma: any = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
};

jest.unstable_mockModule(
  fileURLToPath(new URL("../../../../src/infra/database/prisma/client.ts", import.meta.url)),
  () => ({ prisma }),
);

const repo = await import("../../../../src/infra/database/repositories/users.repository.js");

describe("repositories: users", () => {
  beforeEach(() => {
    Object.values(prisma.user).forEach((fn: any) => fn.mockReset());
    prisma.$transaction.mockClear();
  });

  it("findUserByEmail queries findUnique", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await repo.findUserByEmail("a@a.com");
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { email: "a@a.com" } }));
  });

  it("listUsers uses $transaction", async () => {
    prisma.user.findMany.mockResolvedValue([{ id: "u1" }]);
    prisma.user.count.mockResolvedValue(1);
    const result = await repo.listUsers({ skip: 0, take: 10 });
    expect(result.total).toBe(1);
  });
});
