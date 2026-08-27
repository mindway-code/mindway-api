import { Router } from "express";
import { openApiDocument } from "./document.js";
import { insomniaCollection } from "./insomnia.js";

export const openApiRoutes = Router();

openApiRoutes.get("/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});

openApiRoutes.get("/openapi/insomnia.json", (_req, res) => {
  res.json(insomniaCollection);
});

export default openApiRoutes;
