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
  },
  experimental__runtimeEnv: process.env,
});
