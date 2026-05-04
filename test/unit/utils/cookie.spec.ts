import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const env = {
  NODE_ENV: "test",
  COOKIE_NAME: "refresh_token",
  COOKIE_DOMAIN: "",
  COOKIE_PATH: "/",
  COOKIE_MAX_AGE_DAYS: 30,
};

jest.unstable_mockModule(fileURLToPath(new URL("../../../src/core/config/env.ts", import.meta.url)), () => ({ env }));

const { cookieBaseOptions, setRefreshCookie, clearRefreshCookie } = await import("../../../src/utils/tokens/cookie.js");

describe("utils: tokens/cookie", () => {
  beforeEach(() => {
    env.NODE_ENV = "test";
  });

  it("cookieBaseOptions uses lax in non-prod", () => {
    expect(cookieBaseOptions()).toEqual(
      expect.objectContaining({ httpOnly: true, secure: false, sameSite: "lax", path: "/" }),
    );
  });

  it("cookieBaseOptions uses none+secure in prod", () => {
    env.NODE_ENV = "production" as any;
    expect(cookieBaseOptions()).toEqual(expect.objectContaining({ secure: true, sameSite: "none" }));
  });

  it("setRefreshCookie calls res.cookie with maxAge", () => {
    const res = { cookie: jest.fn(), clearCookie: jest.fn() } as any;
    setRefreshCookie(res, "token");
    expect(res.cookie).toHaveBeenCalledWith(
      "refresh_token",
      "token",
      expect.objectContaining({ maxAge: 30 * 24 * 60 * 60 * 1000 }),
    );
  });

  it("clearRefreshCookie calls res.clearCookie", () => {
    const res = { cookie: jest.fn(), clearCookie: jest.fn() } as any;
    clearRefreshCookie(res);
    expect(res.clearCookie).toHaveBeenCalledWith("refresh_token", expect.any(Object));
  });
});
