import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const repo = {
  createAppointment: jest.fn<(...args: any[]) => any>(),
  listAppointmentsByUser: jest.fn<(...args: any[]) => any>(),
  listAppointmentsByTherapist: jest.fn<(...args: any[]) => any>(),
  updateAppointment: jest.fn<(...args: any[]) => any>(),
  deleteAppointment: jest.fn<(...args: any[]) => any>(),
};

jest.unstable_mockModule(
  fileURLToPath(new URL("../../../src/infra/database/repositories/appointments.repository.ts", import.meta.url)),
  () => repo,
);

const svc = await import("../../../src/api/v1/modules/appointments/appointment.service.js");

describe("appointments: service", () => {
  beforeEach(() => {
    Object.values(repo).forEach((fn: any) => fn.mockReset());
  });

  it("createAppointmentService validates required fields", async () => {
    await expect(svc.createAppointmentService({} as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("createAppointmentService calls repository with parsed input", async () => {
    repo.createAppointment.mockResolvedValue({ id: "a1" });
    const result = await svc.createAppointmentService({
      therapistId: " t1 ",
      userId: " u1 ",
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: "2026-01-01T01:00:00.000Z",
      status: "confirmed",
    } as any);
    expect(result).toEqual({ id: "a1" });
    expect(repo.createAppointment).toHaveBeenCalledWith(expect.objectContaining({ therapistId: "t1", userId: "u1", status: "confirmed" }));
  });

  it("parseStatus defaults when invalid", async () => {
    repo.createAppointment.mockResolvedValue({ id: "a1" });
    await svc.createAppointmentService({
      therapistId: "t1",
      userId: "u1",
      startsAt: new Date(),
      endsAt: new Date(),
      status: "weird",
    } as any);
    expect(repo.createAppointment).toHaveBeenCalledWith(expect.objectContaining({ status: "scheduled" }));
  });
});
