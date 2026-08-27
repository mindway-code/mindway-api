import { errorResponses, jsonBody, successResponse } from "../headers.js";
import type { OpenApiPaths } from "../types.js";

export const authPaths: OpenApiPaths = {
  "/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a local user and start a session",
      requestBody: jsonBody({ $ref: "#/components/schemas/RegisterRequest" }),
      responses: {
        "200": successResponse("Registered. Returns an access token and sets the refresh cookie."),
        ...errorResponses,
      },
    },
  },
  "/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login with email and password",
      requestBody: jsonBody({ $ref: "#/components/schemas/LoginRequest" }),
      responses: {
        "200": successResponse("Logged in. Returns an access token and sets the refresh cookie."),
        ...errorResponses,
      },
    },
  },
  "/auth/refresh": {
    post: {
      tags: ["Auth"],
      summary: "Rotate refresh cookie and return a new access token",
      responses: {
        "200": successResponse("Token refreshed"),
        ...errorResponses,
      },
    },
  },
  "/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Revoke refresh token and clear the refresh cookie",
      responses: {
        "200": successResponse("Logged out"),
        ...errorResponses,
      },
    },
  },
  "/auth": {
    get: {
      tags: ["Auth"],
      summary: "Auth route sanity check",
      responses: {
        "200": successResponse("Auth routes are mounted"),
        ...errorResponses,
      },
    },
  },
};
