import z from "zod";

// ── Sign In ──────────────────────────────────────────
export const signInSchema = z.object({
  email: z
    .email({ error: "Invalid email address" })
    .max(64, { error: "Email must not exceed 64 characters" })
    .toLowerCase(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" })
    .max(128, { error: "Password must not exceed 128 characters" }),
});

export type SignInType = z.infer<typeof signInSchema>;

// ── Sign Up ──────────────────────────────────────────
export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(6, { error: "Name must be at least 6 characters" })
      .max(64, { error: "Name must not exceed 64 characters" }),
    email: z
      .email({ error: "Invalid email address" })
      .max(64, { error: "Email must not exceed 64 characters" })
      .toLowerCase(),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" })
      .max(128, { error: "Password must not exceed 128 characters" }),
    confirmPassword: z
      .string()
      .min(1, { error: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpType = z.infer<typeof signUpSchema>;
