import { serverEnv } from "@/lib/env/serverEnv";

export const PRIMARY_ADMIN_EMAIL = (
  serverEnv.SEED_ADMIN_EMAIL ?? "admin@example.com"
)
  .trim()
  .toLowerCase();

export const isPrimaryAdminEmail = (email: string) =>
  email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL;
