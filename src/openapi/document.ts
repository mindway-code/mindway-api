import { components } from "./components.js";
import { anamnesisPaths } from "./modules/anamnesis.paths.js";
import { authPaths } from "./modules/auth.paths.js";
import { childrenPaths } from "./modules/children.paths.js";
import { communicationPaths } from "./modules/communication.paths.js";
import { familiesPaths } from "./modules/families.paths.js";
import { systemPaths } from "./modules/system.paths.js";
import { usersPaths } from "./modules/users.paths.js";
import { workPaths } from "./modules/work.paths.js";
import type { OpenApiDocument } from "./types.js";

export const openApiDocument: OpenApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Mindway API",
    version: "1.0.0",
    description: "REST API for Mindway. All paths are mounted under /api.",
  },
  servers: [
    { url: "http://localhost:3333/api", description: "Development" },
    { url: "http://localhost:3333/api", description: "Local test" },
    { url: "https://api.mindway.example/api", description: "Production" },
  ],
  tags: [
    { name: "System", description: "Health, OpenAPI, and tooling exports" },
    { name: "Auth", description: "Registration, login, refresh, and logout" },
    { name: "Users", description: "User administration and current profile" },
    { name: "Families", description: "Families and family members" },
    { name: "Tasks", description: "Tasks assigned between users and therapists" },
    { name: "Appointments", description: "Appointment scheduling" },
    { name: "Children", description: "Children and access-code association" },
    { name: "Anamnesis", description: "Child anamnesis sections" },
    { name: "Reports", description: "Reports attached to children" },
    { name: "Messages", description: "Direct and social-network messages" },
    { name: "Social Networks", description: "Social network entities and memberships" },
  ],
  paths: {
    ...systemPaths,
    ...authPaths,
    ...usersPaths,
    ...familiesPaths,
    ...workPaths,
    ...childrenPaths,
    ...anamnesisPaths,
    ...communicationPaths,
  },
  components,
};
