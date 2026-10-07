import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { mockReq, mockRes } from "../helpers/express.js";

const svc = {
  createAppointmentService: jest.fn<(...args: any[]) => any>(),
  listAppointmentsByUserService: jest.fn<(...args: any[]) => any>(),
  listAppointmentsByTherapistService: jest.fn<(...args: any[]) => any>(),
  updateAppointmentService: jest.fn<(...args: any[]) => any>(),
  deleteAppointmentService: jest.fn<(...args: any[]) => any>(),
};

jest.unstable_mockModule("../../src/api/v1/modules/appointments/appointment.service.js", () => svc);

const ctrl = await import("../../src/api/v1/modules/appointments/appointment.controller.js");

describe("controllers: appointments", () => {
  beforeEach(() => {
    Object.values(svc).forEach((fn: any) => fn.mockReset());
  });

  it("createAppointmentController returns message", async () => {
    svc.createAppointmentService.mockResolvedValue({ id: "a1" });
    const req = mockReq({ body: { therapistId: "t1", userId: "u1", startsAt: new Date(), endsAt: new Date() } as any });
    const res = mockRes();
    await ctrl.createAppointmentController(req, res);
    expect((res as any)._getJSONData()).toEqual(expect.objectContaining({ message: "Appointment created" }));
  });

  it("listMyAppointmentsController returns items", async () => {
    svc.listAppointmentsByUserService.mockResolvedValue({ items: [{ id: "a1" }], meta: { pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 } } });
    const req = mockReq({ user: { id: "u1", role: "common" } as any, query: {} as any });
    const res = mockRes();
    await ctrl.listMyAppointmentsController(req, res);
    expect((res as any)._getJSONData()).toEqual(expect.objectContaining({ data: [{ id: "a1" }] }));
  });
});
