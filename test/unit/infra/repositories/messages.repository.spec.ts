import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const prisma: any = {
  message: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
  $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
};

jest.unstable_mockModule(fileURLToPath(new URL("../../../../src/infra/database/prisma/client.ts", import.meta.url)), () => ({ prisma }));

const repo = await import("../../../../src/infra/database/repositories/messages.repository.js");

describe("repositories: messages", () => {
  beforeEach(() => {
    Object.values(prisma.message).forEach((fn: any) => fn.mockReset());
    prisma.$transaction.mockClear();
  });

  it("listDirectMessagesBetweenUsers uses OR filter", async () => {
    prisma.message.findMany.mockResolvedValue([]);
    prisma.message.count.mockResolvedValue(0);
    await repo.listDirectMessagesBetweenUsers("a", "b", { skip: 0, take: 10 });
    const arg = prisma.message.findMany.mock.calls[0][0];
    expect(arg.where.OR).toHaveLength(2);
  });
});

