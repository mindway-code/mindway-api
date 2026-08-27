import { z } from "zod";

const appEnvironments = ["dev", "prod"] as const;
const optionalUrl = z.union([z.string().url(), z.literal("")]).optional().default("");
const optionalEmail = z.union([z.string().email(), z.literal("")]).optional().default("");

function databaseHost(value: string) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isLocalDatabase(value: string) {
  return ["localhost", "127.0.0.1", "::1", "postgres"].includes(databaseHost(value));
}

function isSupabaseDatabase(value: string) {
  return databaseHost(value).includes("supabase");
}

const envSchema = z
  .object({
    APP_ENV: z.enum(appEnvironments),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3333),

    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1),
    REDIS_URL: z.string().url(),

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
    GOOGLE_REDIRECT_URI: optionalUrl,

    CORS_ORIGIN: z.string().min(1),
    AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

    EMAIL_FROM: z.string().optional().default(""),
    GMAIL_USER: optionalEmail,
    GMAIL_APP_PASSWORD: z.string().optional().default(""),
    GMAIL_CLIENT_ID: z.string().optional().default(""),
    GMAIL_CLIENT_SECRET: z.string().optional().default(""),
    GMAIL_REFRESH_TOKEN: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.APP_ENV === "prod") {
      if (data.NODE_ENV !== "production") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["NODE_ENV"],
          message: "APP_ENV=prod requires NODE_ENV=production",
        });
      }

      for (const [key, value] of [
        ["DATABASE_URL", data.DATABASE_URL],
        ["DIRECT_URL", data.DIRECT_URL],
      ] as const) {
        if (value && isLocalDatabase(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: "Production database URLs cannot point to a local database",
          });
        }
      }

      if (!isSupabaseDatabase(data.DATABASE_URL)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["DATABASE_URL"],
          message: "Production DATABASE_URL must point to Supabase",
        });
      }

      if (!data.COOKIE_SECURE || data.COOKIE_SAMESITE !== "none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["COOKIE_SECURE"],
          message: "Production cookies must use COOKIE_SECURE=true and COOKIE_SAMESITE=none",
        });
      }

      if (data.CORS_ORIGIN === "*") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CORS_ORIGIN"],
          message: "Production CORS_ORIGIN must be explicit",
        });
      }
    }

    if (data.APP_ENV === "dev" && data.NODE_ENV === "production") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NODE_ENV"],
        message: "APP_ENV=dev cannot use NODE_ENV=production",
      });
    }

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
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
