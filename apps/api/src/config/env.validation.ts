import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  SESSION_SECRET: z.string().min(16).optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
  TRUST_PROXY: z.string().optional(),
  APP_URL: z.string().optional(),
  MAIL_DRIVER: z.enum(["console", "resend", "disabled"]).default("console"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_GATEWAY: z.enum(["live", "fake"]).optional(),
  STRIPE_ALLOW_LIVE: z.string().optional(),
  // Local MinIO / future R2
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.string().optional(),
  S3_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  S3_BUCKET_PROFILE: z.string().default("hel-profile"),
  S3_BUCKET_PROFILE_PRIVATE: z.string().default("hel-profile-private"),
  S3_BUCKET_CHAT: z.string().default("hel-chat"),
  S3_BUCKET_SUPPORT: z.string().default("hel-support"),
  S3_BUCKET_EVC: z.string().default("hel-evc"),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${details}`);
  }
  return parsed.data;
}
