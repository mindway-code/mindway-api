
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { httpLogger } from "../../core/logger/logger.js";
import { env } from "../../core/config/env.js";
import { corsOptions } from "../../core/config/cors.js";
import { errorHandler } from "../../utils/response.js";
import { v1Routes } from "../../api/v1/v1.routes.js";

export function createApp() {
	const app = express();


	app.use(helmet());

	app.use(httpLogger);

	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	app.use(cookieParser());

  app.use(cors({
    origin: corsOptions().origin,
    credentials: corsOptions().credentials,
    methods: [...corsOptions().methods],
    allowedHeaders: [...corsOptions().allowedHeaders],
  }));

  app.use(v1Routes);

	app.use(errorHandler);

	return app;
}

export default createApp();
