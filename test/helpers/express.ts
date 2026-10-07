import type { Request, Response, NextFunction } from "express";
import { createRequest, createResponse } from "node-mocks-http";
import { jest } from "@jest/globals";

export function mockReq(overrides: Partial<Request> = {}) {
  return Object.assign(
    createRequest({
      method: "GET",
      url: "/",
      headers: {},
    }),
    overrides,
  ) as unknown as Request;
}

export function mockRes(overrides: Partial<Response> = {}) {
  // node-mocks-http response has test-only helpers like `_getJSONData()`
  return Object.assign(createResponse(), overrides) as any;
}

export function mockNext() {
  return jest.fn() as unknown as jest.MockedFunction<NextFunction>;
}
