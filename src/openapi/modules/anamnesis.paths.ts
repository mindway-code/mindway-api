import { bearerSecurity, errorResponses, idParameter, jsonBody, successResponse } from "../headers.js";
import type { OpenApiPaths } from "../types.js";

const sectionBody = {
  type: "object",
  additionalProperties: true,
  description: "Section-specific anamnesis payload. See Zod validators for exact optional fields.",
};

const sectionPath = (section: string, summary: string) => ({
  post: {
    tags: ["Anamnesis"],
    summary: `Upsert ${summary}`,
    security: bearerSecurity,
    parameters: [idParameter("childId")],
    requestBody: jsonBody(sectionBody, false),
    responses: { "200": successResponse(`${summary} upserted`), ...errorResponses },
  },
  put: {
    tags: ["Anamnesis"],
    summary: `Upsert ${summary}`,
    security: bearerSecurity,
    parameters: [idParameter("childId")],
    requestBody: jsonBody(sectionBody, false),
    responses: { "200": successResponse(`${summary} upserted`), ...errorResponses },
  },
  delete: {
    tags: ["Anamnesis"],
    summary: `Delete ${summary}`,
    security: bearerSecurity,
    parameters: [idParameter("childId")],
    responses: { "200": successResponse(`${summary} deleted`), ...errorResponses },
  },
  "x-section": section,
});

export const anamnesisPaths: OpenApiPaths = {
  "/children/{childId}/anamnesis": {
    get: { tags: ["Anamnesis"], summary: "Get anamnesis by child id", security: bearerSecurity, parameters: [idParameter("childId")], responses: { "200": successResponse("Anamnesis"), ...errorResponses } },
    post: { tags: ["Anamnesis"], summary: "Create anamnesis for child", security: bearerSecurity, parameters: [idParameter("childId")], responses: { "200": successResponse("Anamnesis created"), ...errorResponses } },
  },
  "/children/{childId}/anamnesis/general-notes": {
    patch: {
      tags: ["Anamnesis"],
      summary: "Update general notes",
      security: bearerSecurity,
      parameters: [idParameter("childId")],
      requestBody: jsonBody({ type: "object", properties: { generalNotes: { type: "string", nullable: true } } }, false),
      responses: { "200": successResponse("General notes updated"), ...errorResponses },
    },
  },
  "/children/{childId}/anamnesis/birth": sectionPath("birth", "birth section"),
  "/children/{childId}/anamnesis/motor-development": sectionPath("motor-development", "motor development section"),
  "/children/{childId}/anamnesis/language-communication": sectionPath("language-communication", "language communication section"),
  "/children/{childId}/anamnesis/health": sectionPath("health", "health section"),
  "/children/{childId}/anamnesis/behavior": sectionPath("behavior", "behavior section"),
  "/children/{childId}/anamnesis/routine": sectionPath("routine", "routine section"),
};
