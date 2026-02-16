
import http from "http";
import createApp from "./app.js";
import { env } from "../../core/config/env.js";
import { logger } from "../../core/logger/logger.js";

let server: http.Server | null = null;

export async function startServer(): Promise<http.Server> {
	if (server) return server;

	const app = createApp;
	server = http.createServer(app as any);

	return new Promise((resolve) => {
		server!.listen(env.PORT, () => {
			logger.info({ port: env.PORT }, `Server listening on port ${env.PORT}`);
			resolve(server as http.Server);
		});
	});
}

export async function stopServer(): Promise<void> {
	if (!server) return;
	await new Promise<void>((resolve, reject) => {
		server!.close((err) => {
			if (err) return reject(err);
			resolve();
		});
	});
	server = null;
}

if (process.argv[1] && process.argv[1].endsWith("server.ts")) {
	startServer();

	const shutdown = async () => {
		logger.info("Shutting down server");
		try {
			await stopServer();
			process.exit(0);
		} catch (err) {
			logger.error({ err }, "Error during shutdown");
			process.exit(1);
		}
	};

	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
}
