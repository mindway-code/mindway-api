import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import { unauthorized } from "../../src/core/errors/httpError.js";

const rateLimit = { default: (_req: unknown, _res: unknown, next: (error?: unknown) => void) => next() };
const jwt = {
  signAccessToken: jest.fn<() => string>(() => "access-token"),
  extractBearerToken: (header?: string) => header?.startsWith("Bearer ") ? header.slice(7) : null,
  verifyAccessToken: (token: string) => {
    if (token === "user-token") return { sub: "user-1", role: "professional", iat: 0, exp: 0 };
    throw unauthorized("Invalid token");
  },
};
const service = {
  listReportsByChildService: jest.fn<(...args: any[]) => any>(),
  createReportForChildService: jest.fn<(...args: any[]) => any>(),
  getReportByIdService: jest.fn<(...args: any[]) => any>(),
  updateReportService: jest.fn<(...args: any[]) => any>(),
  submitReportService: jest.fn<(...args: any[]) => any>(),
  createNextRevisionService: jest.fn<(...args: any[]) => any>(),
  rejectReportService: jest.fn<(...args: any[]) => any>(),
  listRevisionHistoryService: jest.fn<(...args: any[]) => any>(),
  deleteReportService: jest.fn<(...args: any[]) => any>(),
  validateReportService: jest.fn<(...args: any[]) => any>(),
};

const stepUp = {
  default: () => (req: any, _res: unknown, next: (error?: unknown) => void) => {
    req.stepUp = { method: "TOTP", factorId: "factor-1", idempotentReplay: false };
    next();
  },
};

jest.unstable_mockModule("../../src/core/middlewares/rateLimit.middleware.js", () => rateLimit);
jest.unstable_mockModule("../../src/utils/crypto/jwt.js", () => jwt);
jest.unstable_mockModule("../../src/core/middlewares/requireStepUp.middleware.js", () => stepUp);
jest.unstable_mockModule("../../src/api/v1/modules/reportsChildren/reportsChildren.service.js", () => service);
const { createApp } = await import("../../src/infra/http/app.js");

const id = "00000000-0000-4000-8000-000000000001";
const childId = "00000000-0000-4000-8000-000000000002";
const auth = { Authorization: "Bearer user-token" };

describe("integration: report revision routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    service.listReportsByChildService.mockResolvedValue({ items: [], meta: { pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 } } });
    for (const name of ["createReportForChildService", "getReportByIdService", "updateReportService", "submitReportService", "createNextRevisionService", "rejectReportService"] as const) {
      service[name].mockResolvedValue({ id });
    }
    service.listRevisionHistoryService.mockResolvedValue([]);
    service.deleteReportService.mockResolvedValue({ id });
    service.validateReportService.mockResolvedValue({ id });
  });

  it.each([
    ["get", `/api/reports-children/child/${childId}`],
    ["post", `/api/reports-children/child/${childId}`],
    ["get", `/api/reports-children/${id}`],
    ["get", `/api/reports-children/${id}/revisions`],
    ["patch", `/api/reports-children/${id}/draft`],
    ["post", `/api/reports-children/${id}/submissions`],
    ["post", `/api/reports-children/${id}/rejections`],
    ["post", `/api/reports-children/${id}/revisions`],
    ["post", `/api/reports-children/${id}/validations`],
    ["delete", `/api/reports-children/${id}`],
  ] as Array<["get" | "post" | "patch" | "delete", string]>)("authenticates %s %s", async (method, path) => {
    await request(createApp())[method](path).expect(401);
  });

  it("exposes every validated lifecycle transition", async () => {
    await request(createApp()).get(`/api/reports-children/child/${childId}`).set(auth).expect(200);
    await request(createApp()).post(`/api/reports-children/child/${childId}`).set(auth).send({ title: "Draft" }).expect(200);
    await request(createApp()).get(`/api/reports-children/${id}`).set(auth).expect(200);
    await request(createApp()).get(`/api/reports-children/${id}/revisions`).set(auth).expect(200);
    await request(createApp()).patch(`/api/reports-children/${id}/draft`).set(auth).send({ title: "Changed" }).expect(200);
    await request(createApp()).post(`/api/reports-children/${id}/submissions`).set(auth).expect(200);
    await request(createApp()).post(`/api/reports-children/${id}/rejections`).set(auth).send({ reason: "Needs changes" }).expect(200);
    await request(createApp()).post(`/api/reports-children/${id}/revisions`).set(auth).expect(200);
    await request(createApp())
      .post(`/api/reports-children/${id}/validations`)
      .set(auth)
      .set("X-MFA-Proof", "opaque-proof")
      .set("Idempotency-Key", childId)
      .send({ revisionId: childId, expectedContentHash: "a".repeat(64), type: "AUTHOR_ATTESTATION" })
      .expect(200);
    await request(createApp()).delete(`/api/reports-children/${id}`).set(auth).expect(200);
    expect(service.submitReportService).toHaveBeenCalledTimes(1);
    expect(service.createNextRevisionService).toHaveBeenCalledTimes(1);
    expect(service.deleteReportService).toHaveBeenCalledTimes(1);
    expect(service.validateReportService).toHaveBeenCalledTimes(1);
  });

  it("rejects malformed transition input before the service", async () => {
    await request(createApp()).patch(`/api/reports-children/${id}/draft`).set(auth).send({}).expect(400);
    await request(createApp()).post(`/api/reports-children/${id}/rejections`).set(auth).send({ reason: "" }).expect(400);
    expect(service.updateReportService).not.toHaveBeenCalled();
    expect(service.rejectReportService).not.toHaveBeenCalled();
  });
});
