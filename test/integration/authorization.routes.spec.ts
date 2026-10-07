import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import { unauthorized } from "../../src/core/errors/httpError.js";

const rateLimit = {
  default: (_req: unknown, _res: unknown, next: (error?: unknown) => void) => next(),
};

const jwt = {
  signAccessToken: jest.fn<() => string>(() => "access-token"),
  extractBearerToken: (header?: string) => {
    const [type, token] = header?.split(" ") ?? [];
    return type === "Bearer" && token ? token : null;
  },
  verifyAccessToken: (token: string) => {
    if (token === "therapist-token") return { sub: "therapist-1", role: "therapist", iat: 0, exp: 0 };
    if (token === "admin-token") return { sub: "admin-1", role: "admin", iat: 0, exp: 0 };
    if (token === "common-token") return { sub: "common-1", role: "common", iat: 0, exp: 0 };
    throw unauthorized("Invalid or expired token");
  },
};

const socialNetworksService = {
  listSocialNetworksService: jest.fn<() => Promise<any>>(),
  createSocialNetworkService: jest.fn<() => Promise<any>>(),
  updateSocialNetworkService: jest.fn<() => Promise<any>>(),
  deleteSocialNetworkService: jest.fn<() => Promise<any>>(),
};

jest.unstable_mockModule("../../src/core/middlewares/rateLimit.middleware.js", () => rateLimit);
jest.unstable_mockModule("../../src/utils/crypto/jwt.js", () => jwt);
jest.unstable_mockModule(
  "../../src/api/v1/modules/socialNetworks/socialNetwork.service.js",
  () => socialNetworksService,
);

const { createApp } = await import("../../src/infra/http/app.js");

describe("integration: authentication and role boundaries", () => {
  beforeEach(() => {
    socialNetworksService.listSocialNetworksService.mockReset();
    socialNetworksService.listSocialNetworksService.mockResolvedValue({
      items: [],
      meta: { pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 } },
    });
  });

  it("rejects an anonymous request before the controller", async () => {
    const response = await request(createApp()).get("/api/social-networks").expect(401);

    expect(response.body.error).toEqual(expect.objectContaining({ code: "UNAUTHORIZED" }));
    expect(socialNetworksService.listSocialNetworksService).not.toHaveBeenCalled();
  });

  it("rejects a common user at the therapist role boundary", async () => {
    const response = await request(createApp())
      .get("/api/social-networks")
      .set("Authorization", "Bearer common-token")
      .expect(403);

    expect(response.body.error).toEqual(expect.objectContaining({ code: "FORBIDDEN" }));
    expect(socialNetworksService.listSocialNetworksService).not.toHaveBeenCalled();
  });

  it.each(["therapist-token", "admin-token"])("allows %s through the route boundary", async (token) => {
    const response = await request(createApp())
      .get("/api/social-networks")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        data: [],
        meta: { pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 } },
      }),
    );
    expect(socialNetworksService.listSocialNetworksService).toHaveBeenCalledTimes(1);
  });
});
