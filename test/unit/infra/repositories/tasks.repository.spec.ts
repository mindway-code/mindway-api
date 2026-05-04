import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const prisma: any = {
  task: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn(), delete: jest.fn() },
  $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
};

jest.unstable_mockModule(fileURLToPath(new URL("../../../../src/infra/database/prisma/client.ts", import.meta.url)), () => ({ prisma }));

const repo = await import("../../../../src/infra/database/repositories/tasks.repository.js");

describe("repositories: tasks", () => {
  beforeEach(() => {
    Object.values(prisma.task).forEach((fn: any) => fn.mockReset());
    prisma.$transaction.mockClear();
  });

  it("createTask writes prisma.task.create", async () => {
    prisma.task.create.mockResolvedValue({ id: "t1" });
    await repo.createTask({ therapistId: "th", userId: "u", title: "x" } as any);
    expect(prisma.task.create).toHaveBeenCalled();
  });

  it("listTasksByUser uses $transaction", async () => {
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);
    await repo.listTasksByUser("u1", { skip: 0, take: 10 } as any);
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});

