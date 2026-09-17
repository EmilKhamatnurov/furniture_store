import "server-only";
import { z } from "zod";

const isProd = process.env["NODE_ENV"] === "production";
// Next evaluates server modules while compiling. Credentials for integrations
// such as S3, YuKassa and email are not needed to produce an application
// artifact, but must remain mandatory when that artifact actually runs.
const isProductionBuild = process.env["NEXT_PHASE"] === "phase-production-build";

// Helper: required in production, optional in dev/test.
// Lets you `npm run dev` without having all real credentials yet.
const prodRequired = (schema: z.ZodString) =>
  isProd && !isProductionBuild ? schema : z.string().optional().default("");

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_SECRET: z.string().min(32, "APP_SECRET must be at least 32 characters"),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // S3 — required in prod, optional in dev (placeholder images work without it)
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY: prodRequired(z.string().min(1)),
  S3_SECRET_KEY: prodRequired(z.string().min(1)),
  S3_PUBLIC_HOSTNAME: z.string().min(1),

  // YuKassa — required in prod
  YUKASSA_SHOP_ID: prodRequired(z.string().min(1)),
  YUKASSA_SECRET_KEY: prodRequired(z.string().min(1)),
  YUKASSA_WEBHOOK_SECRET: prodRequired(z.string().min(1)),

  // Email — required in prod
  UNISENDER_API_KEY: prodRequired(z.string().min(1)),
  EMAIL_FROM: z.string().email(),
  EMAIL_FROM_NAME: z.string().min(1),
  // Where admin notifications (new orders) are delivered. Falls back to EMAIL_FROM.
  ADMIN_EMAIL: z.string().email().optional().or(z.literal("")),
  // Admin panel login. Single trusted admin: ADMIN_EMAIL + scrypt hash of the
  // password (generate with `npm run admin:hash <password>`). When the hash is
  // empty, admin login is disabled.
  ADMIN_PASSWORD_HASH: z.string().optional().or(z.literal("")),

  // SMS — always optional
  SMS_AERO_EMAIL: z.string().optional(),
  SMS_AERO_API_KEY: z.string().optional(),
  SMS_AERO_SIGN: z.string().optional(),

  // Monitoring — always optional
  GLITCHTIP_DSN: z.string().url().optional().or(z.literal("")),
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_METRIKA_COUNTER_ID: z.string().optional(),
});

const _serverEnv = serverEnvSchema.safeParse(process.env);
if (!_serverEnv.success) {
  console.error("❌ Invalid server environment variables:");
  console.error(_serverEnv.error.flatten().fieldErrors);
  process.exit(1);
}

const _publicEnv = publicEnvSchema.safeParse(process.env);
if (!_publicEnv.success) {
  console.error("❌ Invalid public environment variables:");
  console.error(_publicEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = _serverEnv.data;
export const publicEnv = _publicEnv.data;

export type Env = typeof env;
export type PublicEnv = typeof publicEnv;
