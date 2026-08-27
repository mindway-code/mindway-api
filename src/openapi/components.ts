export const components = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "Access token returned by /auth/login or /auth/register.",
    },
  },
  parameters: {
    Page: {
      name: "page",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, default: 1 },
    },
    PageSize: {
      name: "pageSize",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
    },
  },
  responses: {
    BadRequest: { description: "Invalid request payload or parameters." },
    Unauthorized: { description: "Missing, invalid, or expired credentials." },
    Forbidden: { description: "Authenticated user cannot access this resource." },
    NotFound: { description: "Resource was not found." },
    TooManyRequests: { description: "Rate limit exceeded." },
    InternalError: { description: "Unexpected server error." },
  },
  schemas: {
    SuccessEnvelope: {
      type: "object",
      required: ["success", "data"],
      properties: {
        success: { type: "boolean", const: true },
        data: {},
        message: { type: "string" },
        meta: { $ref: "#/components/schemas/Meta" },
      },
    },
    ErrorEnvelope: {
      type: "object",
      required: ["success", "error"],
      properties: {
        success: { type: "boolean", const: false },
        error: {
          type: "object",
          required: ["code", "message"],
          properties: {
            code: { type: "string" },
            message: { type: "string" },
            details: {},
          },
        },
      },
    },
    Meta: {
      type: "object",
      properties: {
        pagination: {
          type: "object",
          properties: {
            page: { type: "integer" },
            pageSize: { type: "integer" },
            total: { type: "integer" },
            totalPages: { type: "integer" },
          },
        },
      },
    },
    AuthResult: {
      type: "object",
      properties: { accessToken: { type: "string" } },
    },
    RegisterRequest: {
      type: "object",
      required: ["name", "email", "password", "confirmPassword"],
      properties: {
        name: { type: "string" },
        email: { type: "string", format: "email" },
        password: { type: "string", format: "password" },
        confirmPassword: { type: "string", format: "password" },
        role: { $ref: "#/components/schemas/UserRole" },
        provider: { enum: ["local", "google"] },
        googleId: { type: "string", nullable: true },
      },
    },
    LoginRequest: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", format: "password" },
      },
    },
    UserRole: {
      enum: ["admin", "common", "enterprise", "professional", "therapist"],
    },
    TaskStatus: { enum: ["pending", "in_progress", "done", "canceled"] },
    AppointmentStatus: { enum: ["scheduled", "confirmed", "completed", "canceled", "no_show"] },
    FamilyRole: { enum: ["child", "enterprise", "manager", "therapist", "professional"] },
  },
} as const;
