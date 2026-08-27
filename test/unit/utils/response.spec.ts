import { describe, it, expect } from "@jest/globals";
import { mockRes } from "../../helpers/express.js";
import { badRequest } from "../../../src/core/errors/httpError.js";
import { errorHandler, sendError, sendSuccess } from "../../../src/utils/response.js";

describe("utils: response", () => {
  it("sendSuccess wraps payload", () => {
    const res = mockRes();
    sendSuccess(res as any, { ok: true }, "Done");
    expect((res as any)._getJSONData()).toEqual(
      expect.objectContaining({ success: true, data: { ok: true }, message: "Done" }),
    );
  });

  it("sendError returns HttpError details", () => {
    const res = mockRes();
    sendError(res as any, badRequest("Nope", { field: "x" }));
    expect(res.statusCode).toBe(400);
    expect((res as any)._getJSONData()).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "BAD_REQUEST", message: "Nope", details: { field: "x" } }),
      }),
    );
  });

  it("sendError returns 500 for unknown errors", () => {
    const res = mockRes();
    sendError(res as any, new Error("boom"));
    expect(res.statusCode).toBe(500);
    expect((res as any)._getJSONData()).toEqual(
      expect.objectContaining({ success: false, error: expect.objectContaining({ code: "INTERNAL_ERROR" }) }),
    );
  });

  it("sendError returns 400 for invalid JSON body parser errors", () => {
    const res = mockRes();
    const err = Object.assign(new SyntaxError("Unexpected token"), { body: "{" });

    sendError(res as any, err);

    expect(res.statusCode).toBe(400);
    expect((res as any)._getJSONData()).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "BAD_REQUEST", message: "Invalid JSON body" }),
      }),
    );
  });

  it("errorHandler delegates to sendError", () => {
    const res = mockRes();
    errorHandler(badRequest("x"), {} as any, res as any, (() => {}) as any);
    expect(res.statusCode).toBe(400);
  });
});
