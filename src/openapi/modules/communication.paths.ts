import { bearerSecurity, errorResponses, idParameter, jsonBody, paginationParameters, successResponse } from "../headers.js";
import type { OpenApiPaths } from "../types.js";

const messageBody = {
  type: "object",
  required: ["content"],
  properties: { content: { type: "string" } },
};

const socialNetworkBody = {
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string", nullable: true },
  },
};

const socialNetworkUserBody = {
  type: "object",
  properties: {
    socialNetworkId: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
  },
};

export const communicationPaths: OpenApiPaths = {
  "/messages": {
    get: {
      tags: ["Messages"],
      summary: "Messages route sanity check",
      responses: { "200": successResponse(), ...errorResponses },
    },
  },
  "/messages/dm/{userId}": {
    get: {
      tags: ["Messages"],
      summary: "List direct messages with a user",
      security: bearerSecurity,
      parameters: [idParameter("userId"), ...paginationParameters],
      responses: { "200": successResponse("Direct messages"), ...errorResponses },
    },
    post: {
      tags: ["Messages"],
      summary: "Create a direct message",
      security: bearerSecurity,
      parameters: [idParameter("userId")],
      requestBody: jsonBody(messageBody),
      responses: { "200": successResponse("Message created"), ...errorResponses },
    },
  },
  "/messages/social-networks/{socialNetworkId}": {
    get: {
      tags: ["Messages"],
      summary: "List social network messages",
      security: bearerSecurity,
      parameters: [idParameter("socialNetworkId"), ...paginationParameters],
      responses: { "200": successResponse("Social network messages"), ...errorResponses },
    },
    post: {
      tags: ["Messages"],
      summary: "Create a social network message",
      security: bearerSecurity,
      parameters: [idParameter("socialNetworkId")],
      requestBody: jsonBody(messageBody),
      responses: { "200": successResponse("Message created"), ...errorResponses },
    },
  },
  "/messages/{id}": {
    delete: {
      tags: ["Messages"],
      summary: "Delete a message",
      security: bearerSecurity,
      parameters: [idParameter()],
      responses: { "200": successResponse("Message deleted"), ...errorResponses },
    },
  },
  "/social-networks": {
    get: { tags: ["Social Networks"], summary: "List social networks", security: bearerSecurity, parameters: paginationParameters, responses: { "200": successResponse("Social networks"), ...errorResponses } },
    post: { tags: ["Social Networks"], summary: "Create a social network", security: bearerSecurity, requestBody: jsonBody(socialNetworkBody), responses: { "200": successResponse("Social network created"), ...errorResponses } },
  },
  "/social-networks/{id}": {
    put: { tags: ["Social Networks"], summary: "Update a social network", security: bearerSecurity, parameters: [idParameter()], requestBody: jsonBody(socialNetworkBody, false), responses: { "200": successResponse("Social network updated"), ...errorResponses } },
    delete: { tags: ["Social Networks"], summary: "Delete a social network", security: bearerSecurity, parameters: [idParameter()], responses: { "200": successResponse("Social network deleted"), ...errorResponses } },
  },
  "/social-network-users": {
    get: { tags: ["Social Networks"], summary: "List social network users", security: bearerSecurity, parameters: paginationParameters, responses: { "200": successResponse("Social network users"), ...errorResponses } },
    post: { tags: ["Social Networks"], summary: "Create a social network user", security: bearerSecurity, requestBody: jsonBody(socialNetworkUserBody), responses: { "200": successResponse("Social network user created"), ...errorResponses } },
  },
  "/social-network-users/{id}": {
    get: { tags: ["Social Networks"], summary: "Get a social network user", security: bearerSecurity, parameters: [idParameter()], responses: { "200": successResponse("Social network user"), ...errorResponses } },
    put: { tags: ["Social Networks"], summary: "Update a social network user", security: bearerSecurity, parameters: [idParameter()], requestBody: jsonBody(socialNetworkUserBody, false), responses: { "200": successResponse("Social network user updated"), ...errorResponses } },
    delete: { tags: ["Social Networks"], summary: "Delete a social network user", security: bearerSecurity, parameters: [idParameter()], responses: { "200": successResponse("Social network user deleted"), ...errorResponses } },
  },
  "/social-network": { get: { tags: ["Social Networks"], summary: "Social network route sanity check", responses: { "200": successResponse(), ...errorResponses } } },
  "/social-network-user": { get: { tags: ["Social Networks"], summary: "Social network user route sanity check", responses: { "200": successResponse(), ...errorResponses } } },
};
