import { bearerSecurity, errorResponses, idParameter, jsonBody, paginationParameters, successResponse } from "../headers.js";
import type { OpenApiPaths } from "../types.js";

const childBody = {
  type: "object",
  properties: {
    responsibleId: { type: "string", format: "uuid" },
    secondaryResponsibleId: { type: "string", format: "uuid", nullable: true },
    name: { type: "string" },
    age: { type: "integer", minimum: 0 },
    birthDate: { type: "string", format: "date-time" },
    observation: { type: "string", nullable: true },
  },
};

const reportBody = {
  type: "object",
  properties: {
    title: { type: "string" },
    behavior: { type: "string", nullable: true },
    difficulty: { type: "string", nullable: true },
    recommendation: { type: "string", nullable: true },
    accessCode: { type: "string", minLength: 6, maxLength: 10 },
  },
};

export const childrenPaths: OpenApiPaths = {
  "/children": {
    get: {
      tags: ["Children"],
      summary: "List accessible children",
      security: bearerSecurity,
      parameters: paginationParameters,
      responses: { "200": successResponse("Paginated children"), ...errorResponses },
    },
    post: {
      tags: ["Children"],
      summary: "Create a child",
      security: bearerSecurity,
      requestBody: jsonBody(childBody),
      responses: { "200": successResponse("Child created"), ...errorResponses },
    },
  },
  "/children/me": {
    get: {
      tags: ["Children"],
      summary: "List children accessible to the authenticated user",
      security: bearerSecurity,
      responses: { "200": successResponse("My children"), ...errorResponses },
    },
  },
  "/children/{id}": {
    get: {
      tags: ["Children"],
      summary: "Get a child by id",
      security: bearerSecurity,
      parameters: [idParameter()],
      responses: { "200": successResponse("Child"), ...errorResponses },
    },
    patch: {
      tags: ["Children"],
      summary: "Update a child",
      security: bearerSecurity,
      parameters: [idParameter()],
      requestBody: jsonBody(childBody, false),
      responses: { "200": successResponse("Child updated"), ...errorResponses },
    },
    delete: {
      tags: ["Children"],
      summary: "Delete a child",
      security: bearerSecurity,
      parameters: [idParameter()],
      responses: { "200": successResponse("Child deleted"), ...errorResponses },
    },
  },
  "/children/access/{code}": {
    get: {
      tags: ["Children"],
      summary: "Get a child by access code",
      security: bearerSecurity,
      parameters: [{ name: "code", in: "path", required: true, schema: { type: "string", minLength: 6, maxLength: 10 } }],
      responses: { "200": successResponse("Child by access code"), ...errorResponses },
    },
  },
  "/association-children": {
    get: { tags: ["Children"], summary: "Association child route sanity check", responses: { "200": successResponse(), ...errorResponses } },
    post: {
      tags: ["Children"],
      summary: "Associate authenticated user to a child by access code",
      security: bearerSecurity,
      requestBody: jsonBody({
        type: "object",
        required: ["accessCode"],
        properties: { accessCode: { type: "string", minLength: 6, maxLength: 10 } },
      }),
      responses: { "200": successResponse("Child associated"), ...errorResponses },
    },
  },
  "/reports-children/child/{childId}": {
    get: {
      tags: ["Reports"],
      summary: "List reports for a child",
      security: bearerSecurity,
      parameters: [idParameter("childId"), ...paginationParameters],
      responses: { "200": successResponse("Child reports", { type: "array", items: { $ref: "#/components/schemas/ReportsChild" } }), ...errorResponses },
    },
    post: {
      tags: ["Reports"],
      summary: "Create report revision 1 as a draft",
      security: bearerSecurity,
      parameters: [idParameter("childId")],
      requestBody: jsonBody(reportBody),
      responses: { "200": successResponse("Report draft created", { $ref: "#/components/schemas/ReportsChild" }), ...errorResponses },
    },
  },
  "/reports-children/{id}": {
    get: { tags: ["Reports"], summary: "Get a child report", security: bearerSecurity, parameters: [idParameter()], responses: { "200": successResponse("Report", { $ref: "#/components/schemas/ReportsChild" }), ...errorResponses } },
    patch: { tags: ["Reports"], deprecated: true, summary: "Update current draft (compatibility alias)", security: bearerSecurity, parameters: [idParameter()], requestBody: jsonBody(reportBody, false), responses: { "200": successResponse("Report draft updated", { $ref: "#/components/schemas/ReportsChild" }), ...errorResponses } },
    delete: { tags: ["Reports"], summary: "Archive a report and preserve revisions", security: bearerSecurity, parameters: [idParameter()], responses: { "200": successResponse("Report archived"), ...errorResponses } },
  },
  "/reports-children/{id}/draft": {
    patch: { tags: ["Reports"], summary: "Update the current draft revision", security: bearerSecurity, parameters: [idParameter()], requestBody: jsonBody(reportBody, false), responses: { "200": successResponse("Report draft updated", { $ref: "#/components/schemas/ReportsChild" }), ...errorResponses } },
  },
  "/reports-children/{id}/submissions": {
    post: { tags: ["Reports"], summary: "Freeze and submit the current draft", security: bearerSecurity, parameters: [idParameter()], responses: { "200": successResponse("Report submitted", { $ref: "#/components/schemas/ReportsChild" }), ...errorResponses } },
  },
  "/reports-children/{id}/validations": {
    post: {
      tags: ["Reports"],
      summary: "Attest and publish the exact submitted report revision",
      description: "Consumes the revision-scoped proof before executing one transaction. If that transaction fails, request a new proof. An exact retry with the same proof and Idempotency-Key returns the stored success only when it already exists.",
      security: bearerSecurity,
      parameters: [
        idParameter(),
        { name: "X-MFA-Proof", in: "header", required: true, schema: { type: "string" }, description: "Opaque proof returned by /auth/mfa/step-up-grants." },
        { name: "Idempotency-Key", in: "header", required: true, schema: { type: "string", format: "uuid" } },
      ],
      requestBody: jsonBody({
        type: "object",
        additionalProperties: false,
        required: ["revisionId", "expectedContentHash", "type"],
        properties: {
          revisionId: { type: "string", format: "uuid" },
          expectedContentHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
          type: { type: "string", enum: ["AUTHOR_ATTESTATION"] },
        },
      }),
      responses: { "200": successResponse("Report revision validated and published", { $ref: "#/components/schemas/ReportsChild" }), ...errorResponses },
    },
  },
  "/reports-children/{id}/rejections": {
    post: { tags: ["Reports"], summary: "Reject the current submitted revision", security: bearerSecurity, parameters: [idParameter()], requestBody: jsonBody({ type: "object", required: ["reason"], properties: { reason: { type: "string", minLength: 1, maxLength: 2000 } } }), responses: { "200": successResponse("Report rejected", { $ref: "#/components/schemas/ReportsChild" }), ...errorResponses } },
  },
  "/reports-children/{id}/revisions": {
    get: { tags: ["Reports"], summary: "List report revision history", security: bearerSecurity, parameters: [idParameter()], responses: { "200": successResponse("Revision history", { type: "array", items: { $ref: "#/components/schemas/ReportRevision" } }), ...errorResponses } },
    post: { tags: ["Reports"], summary: "Create the next draft from the published revision", security: bearerSecurity, parameters: [idParameter()], responses: { "200": successResponse("Report revision created", { $ref: "#/components/schemas/ReportsChild" }), ...errorResponses } },
  },
  "/child": { get: { tags: ["Children"], summary: "Children route sanity check", responses: { "200": successResponse(), ...errorResponses } } },
  "/reports-children": { get: { tags: ["Reports"], summary: "Reports route sanity check", responses: { "200": successResponse(), ...errorResponses } } },
};
