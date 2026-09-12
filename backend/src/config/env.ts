import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CORS_ORIGIN: z.string().min(1),
  ACCESS_TOKEN_SECRET: z.string().min(16, "ACCESS_TOKEN_SECRET must be set and reasonably long"),
  REFRESH_TOKEN_SECRET: z.string().min(16, "REFRESH_TOKEN_SECRET must be set and reasonably long"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
  REFRESH_TOKEN_COOKIE_NAME: z.string().default("refresh_token"),
  OVERDUE_CRON_SCHEDULE: z.string().default("*/5 * * * *"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Fix the environment variables above (see .env.example) before starting the server.");
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  corsOrigins: parsed.data.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
};
