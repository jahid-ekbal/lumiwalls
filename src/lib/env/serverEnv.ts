import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z
      .string()
      .startsWith("postgresql://", {
        error:
          "DATABASE_URL must be a Neon Postgres connection string (postgresql://)",
      })
      .min(1, { error: "DATABASE_URL is required" }),
    DIRECT_URL: z
      .string()
      .startsWith("postgresql://", {
        error:
          "DIRECT_URL must be a direct Neon Postgres connection string (postgresql://)",
      })
      .min(1, { error: "DIRECT_URL is required" }),
    CHECKPOINT_DISABLE: z.enum(["1", "0"]).optional(),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, { error: "BETTER_AUTH_SECRET must be at least 32 characters" }),
    BETTER_AUTH_URL: z.url({ error: "BETTER_AUTH_URL must be a valid URL" }),
    BETTER_AUTH_ALLOWED_ORIGINS: z.string().optional(),
    BETTER_AUTH_TELEMETRY: z.enum(["1", "0"]).optional(),
    S3_ENDPOINT: z.url(),
    S3_REGION: z.string().min(1),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
    S3_BUCKET_NAME: z.string().min(1),
    // Primary admin account. Required: the app protects this account from
    // demotion, bans, and deletion. The seed password is seed-only and is
    // validated inside prisma/seed.ts, never by the running app.
    SEED_ADMIN_EMAIL: z.email({
      error: "SEED_ADMIN_EMAIL must be a valid email address",
    }),
  },
  experimental__runtimeEnv: process.env,
});
