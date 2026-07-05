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
  plugins: [admin(), nextCookies()],
});
