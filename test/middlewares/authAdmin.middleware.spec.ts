import { describe, it, expect } from "@jest/globals";
import { mockReq, mockRes, mockNext } from "../helpers/express.js";
import { authAdminMiddleware } from "../../src/core/middlewares/authAdmin.middleware.js";

describe("middlewares: authAdminMiddleware", () => {
  it("forbids when user missing", () => {
    const req = mockReq({ user: undefined as any });
    const res = mockRes();
    const next = mockNext();

    authAdminMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: "FORBIDDEN", statusCode: 403 }));
  });

  it("forbids when role is not admin", () => {
    const req = mockReq({ user: { id: "u1", role: "common" } as any });
    const res = mockRes();
    const next = mockNext();

    authAdminMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: "FORBIDDEN", statusCode: 403 }));
  });

  it("allows when role is admin", () => {
    const req = mockReq({ user: { id: "u1", role: "admin" } as any });
    const res = mockRes();
    const next = mockNext();

    authAdminMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});

