import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { mockReq, mockRes } from "../helpers/express.js";

const authService = {
  loginService: jest.fn<(email: string, password: string) => Promise<any>>(),
  registerService: jest.fn<(input: any) => Promise<any>>(),
  refreshService: jest.fn<(token: string) => Promise<any>>(),
  logoutService: jest.fn<(token?: string) => Promise<void>>(),
};

const cookie = {
  setRefreshCookie: jest.fn(),
  clearRefreshCookie: jest.fn(),
};

jest.unstable_mockModule("../../src/api/v1/modules/auth/auth.service.js", () => authService);
jest.unstable_mockModule("../../src/utils/tokens/cookie.js", () => cookie);

const { loginController } = await import("../../src/api/v1/modules/auth/auth.controller.js");

describe("controllers: auth", () => {
  beforeEach(() => {
    authService.loginService.mockReset();
    cookie.setRefreshCookie.mockReset();
  });

  it("loginController sets refresh cookie and returns access token", async () => {
    authService.loginService.mockResolvedValue({ accessToken: "access", refreshToken: "refresh" });

    const req = mockReq({ body: { email: "a@a.com", password: "pass" } as any });
    const res = mockRes();

    await loginController(req, res);

    expect(cookie.setRefreshCookie).toHaveBeenCalledWith(res, "refresh");
    expect((res as any)._getJSONData()).toEqual(
      expect.objectContaining({
        success: true,
        data: { accessToken: "access" },
        message: "Logged in",
      }),
    );
  });
});
