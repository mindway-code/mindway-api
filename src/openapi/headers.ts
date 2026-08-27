export const jsonContent = {
  "application/json": {
    schema: {},
  },
} as const;

export const bearerSecurity = [{ bearerAuth: [] }] as const;

export const successResponse = (description = "Success") => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/SuccessEnvelope" },
    },
  },
});

export const errorResponses = {
  "400": { $ref: "#/components/responses/BadRequest" },
  "401": { $ref: "#/components/responses/Unauthorized" },
  "403": { $ref: "#/components/responses/Forbidden" },
  "404": { $ref: "#/components/responses/NotFound" },
  "429": { $ref: "#/components/responses/TooManyRequests" },
  "500": { $ref: "#/components/responses/InternalError" },
} as const;

export const paginationParameters = [
  { $ref: "#/components/parameters/Page" },
  { $ref: "#/components/parameters/PageSize" },
] as const;

export const idParameter = (name = "id") => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
});

export const jsonBody = (schema: Record<string, unknown>, required = true) => ({
  required,
  content: {
    "application/json": { schema },
  },
});
