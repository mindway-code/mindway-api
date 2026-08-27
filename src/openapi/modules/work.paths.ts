import { bearerSecurity, errorResponses, idParameter, jsonBody, paginationParameters, successResponse } from "../headers.js";
import type { OpenApiPaths } from "../types.js";

const taskBody = {
  type: "object",
  properties: {
    therapistId: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    status: { $ref: "#/components/schemas/TaskStatus" },
    title: { type: "string" },
    description: { type: "string", nullable: true },
    feedback: { type: "string", nullable: true },
    note: { type: "string", nullable: true },
  },
};

const appointmentBody = {
  type: "object",
  properties: {
    therapistId: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    status: { $ref: "#/components/schemas/AppointmentStatus" },
    title: { type: "string", nullable: true },
    startsAt: { type: "string", format: "date-time" },
    endsAt: { type: "string", format: "date-time" },
    note: { type: "string", nullable: true },
    feedback: { type: "string", nullable: true },
  },
};

const statusParameter = {
  name: "status",
  in: "query",
  required: false,
  schema: { $ref: "#/components/schemas/TaskStatus" },
};

export const workPaths: OpenApiPaths = {
  "/tasks": {
    get: {
      tags: ["Tasks"],
      summary: "List tasks",
      security: bearerSecurity,
      parameters: [...paginationParameters, statusParameter],
      responses: { "200": successResponse("Paginated tasks"), ...errorResponses },
    },
    post: {
      tags: ["Tasks"],
      summary: "Create a task as admin",
      security: bearerSecurity,
      requestBody: jsonBody(taskBody),
      responses: { "200": successResponse("Task created"), ...errorResponses },
    },
  },
  "/tasks/therapist": {
    get: {
      tags: ["Tasks"],
      summary: "List therapist tasks",
      security: bearerSecurity,
      parameters: [...paginationParameters, statusParameter],
      responses: { "200": successResponse("Paginated therapist tasks"), ...errorResponses },
    },
  },
  "/tasks/{id}": {
    put: {
      tags: ["Tasks"],
      summary: "Update a task",
      security: bearerSecurity,
      parameters: [idParameter()],
      requestBody: jsonBody(taskBody, false),
      responses: { "200": successResponse("Task updated"), ...errorResponses },
    },
    delete: {
      tags: ["Tasks"],
      summary: "Delete a task",
      security: bearerSecurity,
      parameters: [idParameter()],
      responses: { "200": successResponse("Task deleted"), ...errorResponses },
    },
  },
  "/appointments": {
    get: {
      tags: ["Appointments"],
      summary: "List appointments as admin",
      security: bearerSecurity,
      parameters: paginationParameters,
      responses: { "200": successResponse("Paginated appointments"), ...errorResponses },
    },
    post: {
      tags: ["Appointments"],
      summary: "Create an appointment as admin",
      security: bearerSecurity,
      requestBody: jsonBody(appointmentBody),
      responses: { "200": successResponse("Appointment created"), ...errorResponses },
    },
  },
  "/appointments/therapist": {
    get: {
      tags: ["Appointments"],
      summary: "List therapist appointments as admin",
      security: bearerSecurity,
      parameters: paginationParameters,
      responses: { "200": successResponse("Paginated therapist appointments"), ...errorResponses },
    },
  },
  "/appointments/{id}": {
    put: { tags: ["Appointments"], summary: "Update an appointment", security: bearerSecurity, parameters: [idParameter()], requestBody: jsonBody(appointmentBody, false), responses: { "200": successResponse("Appointment updated"), ...errorResponses } },
    delete: { tags: ["Appointments"], summary: "Delete an appointment", security: bearerSecurity, parameters: [idParameter()], responses: { "200": successResponse("Appointment deleted"), ...errorResponses } },
  },
  "/task": { get: { tags: ["Tasks"], summary: "Task route sanity check", responses: { "200": successResponse(), ...errorResponses } } },
  "/appointment": { get: { tags: ["Appointments"], summary: "Appointment route sanity check", responses: { "200": successResponse(), ...errorResponses } } },
};
