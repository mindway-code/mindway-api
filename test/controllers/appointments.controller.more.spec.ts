import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { mockReq, mockRes } from "../helpers/express.js";
import { badRequest } from "../../src/core/errors/httpError.js";

const svc = {
  createAppointmentService: jest.fn<(...args: any[]) => any>(),
  listAppointmentsByUserService: jest.fn<(...args: any[]) => any>(),
  listAppointmentsByTherapistService: jest.fn<(...args: any[]) => any>(),
  updateAppointmentService: jest.fn<(...args: any[]) => any>(),
  deleteAppointmentService: jest.fn<(...args: any[]) => any>(),
};

jest.unstable_mockModule("../../src/api/v1/modules/appointments/appointment.service.js", () => svc);

const ctrl = await import("../../src/api/v1/modules/appointments/appointment.controller.js");

describe("controllers: appointments (more)", () => {
  beforeEach(() => {
    Object.values(svc).forEach((fn: any) => fn.mockReset());
  });

  it("listMyTherapistAppointmentsController returns items", async () => {
    svc.listAppointmentsByTherapistService.mockResolvedValue({ items: [], meta: { pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 } } });
    const req = mockReq({ user: { id: "t1", role: "therapist" } as any, query: {} as any });
    const res = mockRes();
    await ctrl.listMyTherapistAppointmentsController(req, res);
    expect((res as any)._getJSONData()).toEqual(expect.objectContaining({ success: true, data: [] }));
  });

  it("updateAppointmentController sends error when service throws", async () => {
    svc.updateAppointmentService.mockImplementation(() => {
      throw badRequest("x");
    });
    const req = mockReq({ params: { id: "a1" } as any, body: {} as any });
    const res = mockRes();
    await ctrl.updateAppointmentController(req, res);
    expect(res.statusCode).toBe(400);
  });
});

