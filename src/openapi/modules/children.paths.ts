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
      responses: { "200": successResponse("Child reports"), ...errorResponses },
    },
    post: {
      tags: ["Reports"],
      summary: "Create a report for a child",
      security: bearerSecurity,
      parameters: [idParameter("childId")],
      requestBody: jsonBody(reportBody),
      responses: { "200": successResponse("Report created"), ...errorResponses },
    },
  },
  "/reports-children/{id}": {
    get: { tags: ["Reports"], summary: "Get a child report", security: bearerSecurity, parameters: [idParameter()], responses: { "200": successResponse("Report"), ...errorResponses } },
    patch: { tags: ["Reports"], summary: "Update a child report", security: bearerSecurity, parameters: [idParameter()], requestBody: jsonBody(reportBody, false), responses: { "200": successResponse("Report updated"), ...errorResponses } },
    delete: { tags: ["Reports"], summary: "Delete a child report", security: bearerSecurity, parameters: [idParameter()], responses: { "200": successResponse("Report deleted"), ...errorResponses } },
  },
  "/child": { get: { tags: ["Children"], summary: "Children route sanity check", responses: { "200": successResponse(), ...errorResponses } } },
  "/reports-children": { get: { tags: ["Reports"], summary: "Reports route sanity check", responses: { "200": successResponse(), ...errorResponses } } },
};
