import { describe, it, expect } from "@jest/globals";
import { mockReq, mockRes, mockNext } from "../helpers/express.js";
import { authTherapistmiddleware } from "../../src/core/middlewares/authTherapist.middleware.js";

describe("middlewares: authTherapistmiddleware", () => {
  it("forbids when user missing", () => {
    const req = mockReq({ user: undefined as any });
    const res = mockRes();
    const next = mockNext();

    authTherapistmiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: "FORBIDDEN", statusCode: 403 }));
  });

  it("allows when role is admin", () => {
    const req = mockReq({ user: { id: "u1", role: "admin" } as any });
    const res = mockRes();
    const next = mockNext();

    authTherapistmiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("forbids when role is therapist", () => {
    const req = mockReq({ user: { id: "u1", role: "therapist" } as any });
    const res = mockRes();
    const next = mockNext();

    authTherapistmiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: "FORBIDDEN", statusCode: 403 }));
  });

  it("allows when role is not therapist", () => {
    const req = mockReq({ user: { id: "u1", role: "common" } as any });
    const res = mockRes();
    const next = mockNext();

    authTherapistmiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});

