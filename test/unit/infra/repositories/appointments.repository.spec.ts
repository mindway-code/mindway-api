import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const prisma: any = {
  appointment: {
    create: jest.fn(),
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

const repo = await import("../../../../src/infra/database/repositories/appointments.repository.js");

describe("repositories: appointments", () => {
  beforeEach(() => {
    prisma.appointment.create.mockReset();
    prisma.appointment.findMany.mockReset();
    prisma.appointment.count.mockReset();
    prisma.appointment.update.mockReset();
    prisma.appointment.delete.mockReset();
    prisma.$transaction.mockClear();
  });

  it("createAppointment writes default fields", async () => {
    prisma.appointment.create.mockResolvedValue({ id: "a1" });
    await repo.createAppointment({ therapistId: "t1", userId: "u1", startsAt: new Date(), endsAt: new Date() } as any);
    expect(prisma.appointment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ therapistId: "t1", userId: "u1" }) }));
  });

  it("listAppointmentsByUser uses $transaction", async () => {
    prisma.appointment.findMany.mockResolvedValue([{ id: "a1" }]);
    prisma.appointment.count.mockResolvedValue(1);
    const result = await repo.listAppointmentsByUser("u1", { status: "scheduled", skip: 0, take: 10 } as any);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result.total).toBe(1);
  });
});
