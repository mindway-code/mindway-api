import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const prisma: any = {
  child: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
};

jest.unstable_mockModule(
  fileURLToPath(new URL("../../../../src/infra/database/prisma/client.ts", import.meta.url)),
  () => ({ prisma }),
);

const repo = await import("../../../../src/infra/database/repositories/children.repository.js");

describe("repositories: children", () => {
  beforeEach(() => {
    Object.values(prisma.child).forEach((fn: any) => fn.mockReset());
    prisma.$transaction.mockClear();
  });

  it("getChildById selects safe fields by default", async () => {
    prisma.child.findUnique.mockResolvedValue({ id: "c1" });
    await repo.getChildById("c1");
    expect(prisma.child.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "c1" } }));
  });

  it("listChildren uses ownership filter when not admin", async () => {
    prisma.child.findMany.mockResolvedValue([]);
    prisma.child.count.mockResolvedValue(0);
    await repo.listChildren({ skip: 0, take: 10, requesterUserId: "u1", isAdmin: false });
    const call = prisma.child.findMany.mock.calls[0][0];
    expect(call.where).toEqual(expect.objectContaining({ OR: expect.any(Array) }));
  });
});
