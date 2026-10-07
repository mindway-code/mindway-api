import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { mockReq, mockRes } from "../helpers/express.js";

const authService = {
  loginService: jest.fn<(...args: any[]) => any>(),
  registerService: jest.fn<(...args: any[]) => any>(),
  refreshService: jest.fn<(...args: any[]) => any>(),
  logoutService: jest.fn<(...args: any[]) => any>(),
};

const cookie = {
  setRefreshCookie: jest.fn(),
  clearRefreshCookie: jest.fn(),
};

jest.unstable_mockModule("../../src/api/v1/modules/auth/auth.service.js", () => authService);
jest.unstable_mockModule("../../src/utils/tokens/cookie.js", () => cookie);

const ctrl = await import("../../src/api/v1/modules/auth/auth.controller.js");

describe("controllers: auth (more)", () => {
  beforeEach(() => {
    Object.values(authService).forEach((fn: any) => fn.mockReset());
    cookie.setRefreshCookie.mockReset();
    cookie.clearRefreshCookie.mockReset();
  });

  it("registerController sets refresh cookie", async () => {
    authService.registerService.mockResolvedValue({ accessToken: "a", refreshToken: "r" });
    const req = mockReq({ cookies: {} as any, body: { name: "A", email: "a@a.com", password: "x", confirmPassword: "x" } as any });
    const res = mockRes();
    await ctrl.registerController(req, res);
    expect(cookie.setRefreshCookie).toHaveBeenCalledWith(res, "r");
    expect((res as any)._getJSONData()).toEqual(expect.objectContaining({ message: "Registered", data: { accessToken: "a" } }));
  });

  it("logoutController clears cookie", async () => {
    authService.logoutService.mockResolvedValue(undefined);
    const req = mockReq({ cookies: { refresh_token: "r" } as any });
    const res = mockRes();
    await ctrl.logoutController(req, res);
    expect(cookie.clearRefreshCookie).toHaveBeenCalled();
  });
});
