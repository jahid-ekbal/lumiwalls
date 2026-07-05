import { hash as argon2Hash, verify as argon2Verify } from "@node-rs/argon2";
import { serverEnv } from "./env/serverEnv";

const encoder = new TextEncoder();

/**
 * Hash a password using @node-rs/argon2 with BETTER_AUTH_SECRET as pepper.
 * This is wired into BetterAuth's emailAndPassword.password.hash option.
 */
export async function hashPasswordFunction(password: string): Promise<string> {
  const secret = encoder.encode(serverEnv.BETTER_AUTH_SECRET);
  return argon2Hash(password, {
    algorithm: 2, // Argon2id
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
    secret,
  });
}

/**
 * Verify a password against an argon2 hash.
 * This is wired into BetterAuth's emailAndPassword.password.verify option.
 */
export async function verifyPasswordFunction(data: {
  hash: string;
  password: string;
}): Promise<boolean> {
  const secret = encoder.encode(serverEnv.BETTER_AUTH_SECRET);
  return argon2Verify(data.hash, data.password, {
    secret,
  });
}
