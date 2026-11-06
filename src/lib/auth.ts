import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { hashPasswordFunction, verifyPasswordFunction } from "./argon2";
import prisma from "./database/dbClient";
import { serverEnv } from "./env/serverEnv";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: serverEnv.BETTER_AUTH_URL,
  secret: serverEnv.BETTER_AUTH_SECRET,
  trustedOrigins: Array.from(
    new Set(
      [
        serverEnv.BETTER_AUTH_URL,
        ...(serverEnv.BETTER_AUTH_ALLOWED_ORIGINS?.split(",")
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0) ?? []),
      ].map((origin) => origin.replace(/\/$/, "")),
    ),
  ),
  advanced: {
    cookiePrefix: "cit",
    defaultCookieAttributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    password: {
      hash: hashPasswordFunction,
      verify: verifyPasswordFunction,
    },
  },
  // All user mutations go through our server actions so the admin safety
  // guards cannot be bypassed by calling Better Auth directly.
  disabledPaths: [
    "/admin/set-role",
    "/admin/create-user",
    "/admin/update-user",
    "/admin/ban-user",
    "/admin/unban-user",
    "/admin/impersonate-user",
    "/admin/stop-impersonating",
    "/admin/revoke-user-session",
    "/admin/revoke-user-sessions",
    "/admin/remove-user",
    "/admin/set-user-password",
  ],
  plugins: [admin(), nextCookies()],
});
