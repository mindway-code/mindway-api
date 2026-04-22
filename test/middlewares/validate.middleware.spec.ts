import { describe, it, expect } from "@jest/globals";
import { z } from "zod";
import { validate } from "../../src/core/middlewares/validate.middleware.js";
import { mockReq, mockRes, mockNext } from "../helpers/express.js";

describe("middlewares: validate", () => {
  it("returns BAD_REQUEST when schema validation fails", () => {
    const schema = z.object({ name: z.string().min(1) });
    const mw = validate(schema);

    const req = mockReq({ body: {} as any });
    const res = mockRes();
    const next = mockNext();

    mw(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: "BAD_REQUEST", statusCode: 400 }));
  });

  it("coerces/parses and replaces req[target] when valid", () => {
    const schema = z.object({ page: z.coerce.number().int().positive() });
    const mw = validate(schema, "query");

    const req = mockReq({ query: { page: "2" } as any });
    const res = mockRes();
    const next = mockNext();

    mw(req, res, next);

    expect((req as any).query).toEqual({ page: 2 });
    expect(next).toHaveBeenCalledWith();
  });
});
