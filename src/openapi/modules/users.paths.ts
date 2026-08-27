import { bearerSecurity, errorResponses, jsonBody, paginationParameters, successResponse } from "../headers.js";
import type { OpenApiPaths } from "../types.js";

const userBody = {
  type: "object",
  properties: {
    name: { type: "string" },
    email: { type: "string", format: "email", nullable: true },
    password: { type: "string", format: "password" },
    role: { $ref: "#/components/schemas/UserRole" },
    provider: { enum: ["local", "google"] },
    googleId: { type: "string" },
  },
};

export const usersPaths: OpenApiPaths = {
  "/users": {
    get: {
      tags: ["Users"],
      summary: "List users",
      security: bearerSecurity,
      parameters: paginationParameters,
      responses: {
        "200": successResponse("Paginated users"),
        ...errorResponses,
      },
    },
    post: {
      tags: ["Users"],
      summary: "Create a user as admin",
      security: bearerSecurity,
      requestBody: jsonBody(userBody),
      responses: {
        "200": successResponse("User created"),
        ...errorResponses,
      },
    },
  },
  "/users/me": {
    get: {
      tags: ["Users"],
      summary: "Get the authenticated user profile",
      security: bearerSecurity,
      responses: {
        "200": successResponse("Current user"),
        ...errorResponses,
      },
    },
    patch: {
      tags: ["Users"],
      summary: "Update the authenticated user profile",
      security: bearerSecurity,
      requestBody: jsonBody(userBody, false),
      responses: {
        "200": successResponse("User updated"),
        ...errorResponses,
      },
    },
    delete: {
      tags: ["Users"],
      summary: "Delete the authenticated user",
      security: bearerSecurity,
      responses: {
        "200": successResponse("User deleted"),
        ...errorResponses,
      },
    },
  },
};
