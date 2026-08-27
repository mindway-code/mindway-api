function setDefaultEnv(key: string, value: string) {
  if (process.env[key] === undefined) process.env[key] = value;
}

setDefaultEnv("NODE_ENV", "test");
setDefaultEnv("APP_ENV", "dev");
setDefaultEnv("PORT", "3333");

// Prisma only needs this to exist for client construction in most cases; we avoid real connections in tests.
setDefaultEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/mindway_test?schema=public");
setDefaultEnv("DIRECT_URL", "postgresql://user:pass@localhost:5432/mindway_test?schema=public");
setDefaultEnv("REDIS_URL", "redis://localhost:6379");

// JWT secrets must pass env validation (min length 20).
setDefaultEnv("JWT_ACCESS_SECRET", "test_jwt_access_secret_1234567890");
setDefaultEnv("JWT_REFRESH_SECRET", "test_jwt_refresh_secret_1234567890");
setDefaultEnv("JWT_ACCESS_EXPIRES_IN", "15m");
setDefaultEnv("JWT_REFRESH_EXPIRES_IN", "30d");

setDefaultEnv("COOKIE_NAME", "refresh_token");
setDefaultEnv("COOKIE_SECURE", "false");
setDefaultEnv("COOKIE_DOMAIN", "");
setDefaultEnv("COOKIE_SAMESITE", "lax");
setDefaultEnv("COOKIE_PATH", "/");
setDefaultEnv("COOKIE_MAX_AGE_DAYS", "30");

setDefaultEnv("CORS_ORIGIN", "http://localhost:4200");

// Required due to current env schema using `.url().optional().default("")`
setDefaultEnv("GOOGLE_REDIRECT_URI", "http://localhost:3333/auth/google/callback");

// Required due to current env schema using `.email().optional().default("")`
setDefaultEnv("GMAIL_USER", "test@gmail.com");
setDefaultEnv("EMAIL_FROM", "no-reply@example.com");
setDefaultEnv("GMAIL_APP_PASSWORD", "test-app-password");

setDefaultEnv("AUTH_RATE_LIMIT_WINDOW_MS", String(15 * 60 * 1000));
setDefaultEnv("AUTH_RATE_LIMIT_MAX", "1000");

// Keep logs quiet in tests
setDefaultEnv("LOG_LEVEL", "silent");
