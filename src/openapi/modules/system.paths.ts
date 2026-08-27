import { errorResponses, successResponse } from "../headers.js";
import type { OpenApiPaths } from "../types.js";

export const systemPaths: OpenApiPaths = {
  "/health": {
    get: {
      tags: ["System"],
      summary: "Health check",
      responses: {
        "200": successResponse("Server is available"),
        ...errorResponses,
      },
    },
  },
  "/openapi.json": {
    get: {
      tags: ["System"],
      summary: "OpenAPI document",
      responses: {
        "200": {
          description: "OpenAPI 3.1 document for the mounted API.",
        },
      },
    },
  },
  "/openapi/insomnia.json": {
    get: {
      tags: ["System"],
      summary: "Insomnia collection export",
      responses: {
        "200": {
          description: "Importable Insomnia v4 collection.",
        },
      },
    },
  },
};
