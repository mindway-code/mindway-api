export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR"
  | "BAD_REQUEST"
  | "PASSWORD_REAUTHENTICATION_UNSUPPORTED"
  | "ACCESS_TOKEN_MISSING"
  | "ACCESS_TOKEN_INVALID"
  | "ACCESS_TOKEN_EXPIRED"
  | "MFA_NOT_CONFIGURED"
  | "MFA_ALREADY_CONFIGURED"
  | "MFA_REAUTHENTICATION_REQUIRED"
  | "MFA_ENROLLMENT_EXPIRED"
  | "MFA_CODE_INVALID"
  | "MFA_CODE_REUSED"
  | "MFA_RATE_LIMITED"
  | "MFA_RECOVERY_CODE_INVALID"
  | "MFA_SECURITY_STORE_UNAVAILABLE"
  | "REPORT_NOT_EDITABLE"
  | "REPORT_NOT_DRAFT"
  | "REPORT_ALREADY_SUBMITTED"
  | "REPORT_REVISION_CONFLICT"
  | "REPORT_ARCHIVED";

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(params: { statusCode: number; code: ErrorCode; message: string; details?: unknown }) {
    super(params.message);
    this.name = "HttpError";
    this.statusCode = params.statusCode;
    this.code = params.code;
    this.details = params.details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError({ statusCode: 400, code: "BAD_REQUEST", message, details });

export const unauthorized = (message = "Unauthorized", details?: unknown) =>
  new HttpError({ statusCode: 401, code: "UNAUTHORIZED", message, details });

export const accessTokenMissing = () =>
  new HttpError({ statusCode: 401, code: "ACCESS_TOKEN_MISSING", message: "Access token is required" });

export const accessTokenInvalid = () =>
  new HttpError({ statusCode: 401, code: "ACCESS_TOKEN_INVALID", message: "Access token is invalid" });

export const accessTokenExpired = () =>
  new HttpError({ statusCode: 401, code: "ACCESS_TOKEN_EXPIRED", message: "Access token has expired" });

export const passwordReauthenticationUnsupported = (
  message = "Password reauthentication is unavailable for this account",
) =>
  new HttpError({
    statusCode: 409,
    code: "PASSWORD_REAUTHENTICATION_UNSUPPORTED",
    message,
  });

export const mfaError = (params: {
  code:
    | "MFA_NOT_CONFIGURED"
    | "MFA_ALREADY_CONFIGURED"
    | "MFA_REAUTHENTICATION_REQUIRED"
    | "MFA_ENROLLMENT_EXPIRED"
    | "MFA_CODE_INVALID"
    | "MFA_CODE_REUSED"
    | "MFA_RATE_LIMITED"
    | "MFA_RECOVERY_CODE_INVALID"
    | "MFA_SECURITY_STORE_UNAVAILABLE";
  statusCode: number;
  message: string;
}) => new HttpError(params);

export const reportError = (params: {
  code: "REPORT_NOT_EDITABLE" | "REPORT_NOT_DRAFT" | "REPORT_ALREADY_SUBMITTED" | "REPORT_REVISION_CONFLICT" | "REPORT_ARCHIVED";
  statusCode?: number;
  message: string;
}) => new HttpError({ statusCode: params.statusCode ?? 409, code: params.code, message: params.message });

export const forbidden = (message = "Forbidden", details?: unknown) =>
  new HttpError({ statusCode: 403, code: "FORBIDDEN", message, details });

export const notFound = (message = "Not Found", details?: unknown) =>
  new HttpError({ statusCode: 404, code: "NOT_FOUND", message, details });

export const conflict = (message = "Conflict", details?: unknown) =>
  new HttpError({ statusCode: 409, code: "CONFLICT", message, details });

export const tooManyRequests = (message = "Too Many Requests", details?: unknown) =>
  new HttpError({ statusCode: 429, code: "TOO_MANY_REQUESTS", message, details });
