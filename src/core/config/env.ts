import "dotenv/config";
import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3333),

    DATABASE_URL: z.string().min(1),

    JWT_ACCESS_SECRET: z.string().min(20),
    JWT_REFRESH_SECRET: z.string().min(20),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

    COOKIE_NAME: z.string().default("refresh_token"),
    COOKIE_SECURE: z.coerce.boolean().default(false),
    COOKIE_DOMAIN: z.string().optional().default(""),
    COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
    COOKIE_PATH: z.string().default("/"),
    COOKIE_MAX_AGE_DAYS: z.coerce.number().int().positive().default(30),

    GOOGLE_CLIENT_ID: z.string().optional().default(""),
    GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
    GOOGLE_REDIRECT_URI: z.string().url().optional().default(""),

    CORS_ORIGIN: z.string().min(1),

    AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),

    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),


    EMAIL_FROM: z.string().optional().default(""),
    GMAIL_USER: z.string().email().optional().default(""),

    // Option A: App Password
    GMAIL_APP_PASSWORD: z.string().optional().default(""),

    // Option B: OAuth2
    GMAIL_CLIENT_ID: z.string().optional().default(""),
    GMAIL_CLIENT_SECRET: z.string().optional().default(""),
    GMAIL_REFRESH_TOKEN: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {

    const wantsEmail = Boolean(data.EMAIL_FROM || data.GMAIL_USER);

    if (!wantsEmail) return;

    if (!data.EMAIL_FROM) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["EMAIL_FROM"],
        message: "EMAIL_FROM is required when email is enabled",
      });
    }

    if (!data.GMAIL_USER) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GMAIL_USER"],
        message: "GMAIL_USER is required when email is enabled",
      });
    }

    const hasAppPassword = Boolean(data.GMAIL_APP_PASSWORD);
    const hasOAuth2 =
      Boolean(data.GMAIL_CLIENT_ID) && Boolean(data.GMAIL_CLIENT_SECRET) && Boolean(data.GMAIL_REFRESH_TOKEN);

    if (!hasAppPassword && !hasOAuth2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GMAIL_APP_PASSWORD"],
        message: "Provide GMAIL_APP_PASSWORD or Gmail OAuth2 credentials (GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN)",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Don’t leak secrets; only show validation errors
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
