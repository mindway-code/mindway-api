import { bearerSecurity, errorResponses, idParameter, jsonBody, paginationParameters, successResponse } from "../headers.js";
import type { OpenApiPaths } from "../types.js";

const familyBody = {
  type: "object",
  required: ["name"],
  properties: { name: { type: "string" } },
};

const familyMemberBody = {
  type: "object",
  properties: {
    userId: { type: "string", format: "uuid" },
    familyId: { type: "string", format: "uuid" },
    role: { $ref: "#/components/schemas/FamilyRole" },
  },
};

export const familiesPaths: OpenApiPaths = {
  "/families": {
    get: {
      tags: ["Families"],
      summary: "List families as admin",
      security: bearerSecurity,
      parameters: paginationParameters,
      responses: { "200": successResponse("Paginated families"), ...errorResponses },
    },
    post: {
      tags: ["Families"],
      summary: "Create a family as admin",
      security: bearerSecurity,
      requestBody: jsonBody(familyBody),
      responses: { "200": successResponse("Family created"), ...errorResponses },
    },
  },
  "/families/me": {
    get: {
      tags: ["Families"],
      summary: "List families for the authenticated user",
      security: bearerSecurity,
      responses: { "200": successResponse("User families"), ...errorResponses },
    },
    put: {
      tags: ["Families"],
      summary: "Update current family route",
      description: "Current implementation expects an id internally even though the route has no id parameter.",
      security: bearerSecurity,
      requestBody: jsonBody(familyBody),
      responses: { "200": successResponse("Family updated"), ...errorResponses },
    },
    delete: {
      tags: ["Families"],
      summary: "Delete current family route",
      description: "Current implementation expects an id internally even though the route has no id parameter.",
      security: bearerSecurity,
      responses: { "200": successResponse("Family deleted"), ...errorResponses },
    },
  },
  "/family-members": {
    get: {
      tags: ["Families"],
      summary: "List family members as admin",
      security: bearerSecurity,
      parameters: paginationParameters,
      responses: { "200": successResponse("Paginated family members"), ...errorResponses },
    },
    post: {
      tags: ["Families"],
      summary: "Create a family member as admin",
      security: bearerSecurity,
      requestBody: jsonBody(familyMemberBody),
      responses: { "200": successResponse("Family member created"), ...errorResponses },
    },
  },
  "/family-members/{id}": {
    get: {
      tags: ["Families"],
      summary: "Get a family member",
      security: bearerSecurity,
      parameters: [idParameter()],
      responses: { "200": successResponse("Family member"), ...errorResponses },
    },
    put: {
      tags: ["Families"],
      summary: "Update a family member",
      security: bearerSecurity,
      parameters: [idParameter()],
      requestBody: jsonBody(familyMemberBody, false),
      responses: { "200": successResponse("Family member updated"), ...errorResponses },
    },
    delete: {
      tags: ["Families"],
      summary: "Delete a family member",
      security: bearerSecurity,
      parameters: [idParameter()],
      responses: { "200": successResponse("Family member deleted"), ...errorResponses },
    },
  },
  "/family": { get: { tags: ["Families"], summary: "Family route sanity check", responses: { "200": successResponse(), ...errorResponses } } },
  "/family-member": { get: { tags: ["Families"], summary: "Family member route sanity check", responses: { "200": successResponse(), ...errorResponses } } },
};
