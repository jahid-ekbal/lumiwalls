import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const clientEnv = createEnv({
  client: {
    NEXT_PUBLIC_S3_PUBLIC_URL: z.url().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_S3_PUBLIC_URL: process.env.NEXT_PUBLIC_S3_PUBLIC_URL,
  },
});
