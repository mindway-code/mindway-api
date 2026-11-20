import { errorResponses, jsonBody, successResponse } from "../headers.js";
import type { OpenApiPaths } from "../types.js";

export const authPaths: OpenApiPaths = {
  "/auth/mfa": {
    get: {
      tags: ["Auth"],
      summary: "Get MFA status for the authenticated user",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": successResponse("MFA status", { $ref: "#/components/schemas/MfaStatus" }),
        ...errorResponses,
      },
    },
  },
  "/auth/mfa/totp/enrollments": {
    post: {
      tags: ["Auth"],
      summary: "Start a password-reauthenticated TOTP enrollment",
      description: "The returned otpauth URI must be rendered locally. Google-only accounts are unsupported until provider reauthentication is implemented.",
      security: [{ bearerAuth: [] }],
      requestBody: jsonBody({ $ref: "#/components/schemas/StartTotpEnrollmentRequest" }),
      responses: {
        "200": successResponse("Pending TOTP enrollment", { $ref: "#/components/schemas/StartTotpEnrollmentResult" }),
        ...errorResponses,
      },
    },
  },
  "/auth/mfa/totp/enrollments/{id}/confirm": {
    post: {
      tags: ["Auth"],
      summary: "Confirm a pending TOTP enrollment",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      requestBody: jsonBody({ $ref: "#/components/schemas/ConfirmTotpEnrollmentRequest" }),
      responses: {
        "200": successResponse("TOTP enabled and recovery codes returned once", { $ref: "#/components/schemas/RecoveryCodesResult" }),
        ...errorResponses,
      },
    },
  },
  "/auth/mfa/recovery-codes/regenerate": {
    post: {
      tags: ["Auth"],
      summary: "Regenerate one-time recovery codes",
      security: [{ bearerAuth: [] }],
      requestBody: jsonBody({ $ref: "#/components/schemas/MfaProtectedActionRequest" }),
      responses: {
        "200": successResponse("Replacement recovery codes returned once", { $ref: "#/components/schemas/RecoveryCodesResult" }),
        ...errorResponses,
      },
    },
  },
  "/auth/mfa/totp": {
    delete: {
      tags: ["Auth"],
      summary: "Disable TOTP using password and an MFA code",
      security: [{ bearerAuth: [] }],
      requestBody: jsonBody({ $ref: "#/components/schemas/MfaProtectedActionRequest" }),
      responses: {
        "200": successResponse("TOTP disabled"),
        ...errorResponses,
      },
    },
  },
  "/auth/mfa/step-up-grants": {
    post: {
      tags: ["Auth"],
      summary: "Issue a five-minute resource-scoped step-up proof",
      description: "Verifies and atomically consumes a TOTP step or recovery code. The opaque proof is returned once and must remain in memory.",
      security: [{ bearerAuth: [] }],
      requestBody: jsonBody({ $ref: "#/components/schemas/StepUpGrantRequest" }),
      responses: {
        "200": successResponse("Single-use step-up proof", { $ref: "#/components/schemas/StepUpGrantResult" }),
        ...errorResponses,
      },
    },
  },
  "/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a local user and start a session",
      description: "Public registration accepts only common, enterprise, professional, or therapist. Role selection is not external verification.",
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
