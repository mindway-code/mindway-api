import { env } from "./env.js";

export function corsOptions() {
	const raw = env.CORS_ORIGIN || "*";

	// support comma-separated origins
	const origin = raw.includes(",") ? raw.split(",").map((s) => s.trim()) : raw;

	return {
		origin,
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	} as const;
}

export default corsOptions;
