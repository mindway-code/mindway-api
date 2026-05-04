import { describe, it, expect, jest, beforeAll, beforeEach } from "@jest/globals";
import request from "supertest";
import { forbidden, notFound } from "../../src/core/errors/httpError.js";

const rateLimit = {
  default: (_req: any, _res: any, next: any) => next(),
};

const auth = {
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: "u1", role: "common" };
    next();
  },
  default: (req: any, res: any, next: any) => auth.authMiddleware(req, res, next),
};

const childrenService = {
  createChildService: jest.fn(),
  listChildrenService: jest.fn(),
  getChildByIdService: jest.fn(),
  updateChildService: jest.fn(),
  deleteChildService: jest.fn(),
  getChildByAccessCodeService: jest.fn(),
};

jest.unstable_mockModule("../../src/core/middlewares/rateLimit.middleware.js", () => rateLimit);
jest.unstable_mockModule("../../src/core/middlewares/auth.middleware.js", () => auth);
jest.unstable_mockModule("../../src/api/v1/modules/children/children.service.js", () => childrenService);

const { createApp } = await import("../../src/infra/http/app.js");

describe("integration: children routes", () => {
  beforeAll(() => {
    process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:4200";
  });

  beforeEach(() => {
    childrenService.createChildService.mockReset();
    childrenService.getChildByAccessCodeService.mockReset();
  });

  it("POST /children returns 400 on validation error", async () => {
    const app = createApp();

    const res = await request(app).post("/api/children").send({ age: 8 }).expect(400);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "BAD_REQUEST", message: "Validation failed" }),
      }),
    );
    expect(childrenService.createChildService).not.toHaveBeenCalled();
  });

  it("POST /children returns 200 on success", async () => {
    childrenService.createChildService.mockResolvedValue({ id: "c1", accessCode: "ABCDEFGH" });
    const app = createApp();

    const res = await request(app)
      .post("/api/children")
      .send({ name: "Kid", age: 8, birthDate: "2020-01-01" })
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: "c1", accessCode: "ABCDEFGH" }),
        message: "Child created",
      }),
    );
  });

  it("GET /children/access/:code returns 404 when code invalid", async () => {
    childrenService.getChildByAccessCodeService.mockImplementation(() => {
      throw notFound("Invalid accessCode");
    });
    const app = createApp();

    const res = await request(app).get("/api/children/access/ABCDEFGH").expect(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "NOT_FOUND" }),
      }),
    );
  });

  it("POST /children returns 403 when service forbids", async () => {
    childrenService.createChildService.mockImplementation(() => {
      throw forbidden();
    });
    const app = createApp();

    const res = await request(app)
      .post("/api/children")
      .send({ name: "Kid", age: 8, birthDate: "2020-01-01" })
      .expect(403);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "FORBIDDEN" }),
      }),
    );
  });
});

