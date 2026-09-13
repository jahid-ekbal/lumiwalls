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
  rememberMe: z.boolean().optional().default(false),
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

// ── Upload ───────────────────────────────────────────
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

export const initiateUploadSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).optional(),
  categoryId: z.cuid(),
  tagIds: z.array(z.cuid()).max(10).default([]),
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  fileSize: z.number().int().min(1).max(MAX_UPLOAD_SIZE),
});

export type InitiateUploadType = z.infer<typeof initiateUploadSchema>;

export const finalizeUploadSchema = z.object({
  wallpaperId: z.string().min(1),
  key: z.string().min(1),
});

export type FinalizeUploadType = z.infer<typeof finalizeUploadSchema>;

// ── Taxonomy (admin) ─────────────────────────────────
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const categoryCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Name must be at least 2 characters" })
    .max(40, { error: "Name must not exceed 40 characters" }),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(slugRegex, {
      error: "Slug must be lowercase letters, numbers, hyphens",
    })
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(500, { error: "Description must not exceed 500 characters" })
    .optional()
    .or(z.literal("")),
  icon: z.string().trim().max(40).optional().or(z.literal("")),
  color: z
    .string()
    .trim()
    .regex(hexColorRegex, { error: "Color must be hex like #RRGGBB" })
    .optional()
    .or(z.literal("")),
});

export type CategoryCreateType = z.infer<typeof categoryCreateSchema>;

export const categoryUpdateSchema = categoryCreateSchema.extend({
  id: z.cuid(),
});

export type CategoryUpdateType = z.infer<typeof categoryUpdateSchema>;

export const tagCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Name must be at least 1 character" })
    .max(50, { error: "Name must not exceed 50 characters" }),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(slugRegex, {
      error: "Slug must be lowercase letters, numbers, hyphens",
    })
    .optional()
    .or(z.literal("")),
});

export type TagCreateType = z.infer<typeof tagCreateSchema>;

export const tagUpdateSchema = tagCreateSchema.extend({
  id: z.cuid(),
});

export type TagUpdateType = z.infer<typeof tagUpdateSchema>;

// ── Browse ─────────────────────────────────────────────
export const browseSortSchema = z.enum([
  "newest",
  "oldest",
  "views",
  "downloads",
]);

export type BrowseSortType = z.infer<typeof browseSortSchema>;

export const browseSearchParamsSchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  category: z.string().trim().max(40).optional().default("all"),
  sort: browseSortSchema.optional().default("newest"),
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
  preview: z.string().trim().max(100).optional().default(""),
});

export type BrowseSearchParamsType = z.infer<typeof browseSearchParamsSchema>;

export const browseDownloadSchema = z.object({
  wallpaperId: z.string().min(1),
});

export type BrowseDownloadType = z.infer<typeof browseDownloadSchema>;
