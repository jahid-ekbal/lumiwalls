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

// ── Moderation (admin) ─────────────────────────────────
export const moderationDecisionSchema = z.enum(["APPROVED", "REJECTED"]);

export type ModerationDecisionType = z.infer<typeof moderationDecisionSchema>;

export const moderationReviewSchema = z.object({
  wallpaperId: z.string().min(1),
  decision: moderationDecisionSchema,
  reviewNotes: z.string().trim().max(2000).optional().default(""),
});

export type ModerationReviewType = z.infer<typeof moderationReviewSchema>;

export const bulkReviewSchema = z.object({
  wallpaperIds: z.array(z.string().min(1)).min(1).max(50),
  decision: moderationDecisionSchema,
  reviewNotes: z.string().trim().max(2000).optional().default(""),
});

export type BulkReviewType = z.infer<typeof bulkReviewSchema>;

export const banUserSchema = z.object({
  userId: z.string().min(1),
  banned: z.boolean(),
  banReason: z.string().trim().max(500).optional().default(""),
  banExpires: z.coerce.date().optional(),
});

export type BanUserType = z.infer<typeof banUserSchema>;

export const reportReasonSchema = z.enum([
  "SPAM",
  "NUDITY",
  "COPYRIGHT",
  "VIOLENCE",
  "OTHER",
]);

export type ReportReasonType = z.infer<typeof reportReasonSchema>;

export const reportResolveSchema = z.object({
  reportId: z.string().min(1),
  decision: z.enum(["RESOLVED", "DISMISSED"]),
  hideWallpaper: z.boolean().optional().default(false),
});

export type ReportResolveType = z.infer<typeof reportResolveSchema>;

export const hardDeleteWallpaperSchema = z.object({
  wallpaperId: z.string().min(1),
});

export type HardDeleteWallpaperType = z.infer<typeof hardDeleteWallpaperSchema>;

export const moderationSearchParamsSchema = z.object({
  tab: z.enum(["queue", "reports"]).optional().default("queue"),
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED"])
    .optional()
    .default("PENDING"),
  reportStatus: z
    .enum(["PENDING", "RESOLVED", "DISMISSED", "ALL"])
    .optional()
    .default("PENDING"),
  q: z.string().trim().max(100).optional().default(""),
  category: z.string().trim().max(40).optional().default("all"),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
});

export type ModerationSearchParamsType = z.infer<
  typeof moderationSearchParamsSchema
>;

// ── Users (admin) ────────────────────────────────────
export const usersSearchParamsSchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  role: z.enum(["all", "admin", "user"]).optional().default("all"),
  status: z.enum(["all", "active", "banned"]).optional().default("all"),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
});

export type UsersSearchParamsType = z.infer<typeof usersSearchParamsSchema>;

export const setRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "user"]),
});

export type SetRoleType = z.infer<typeof setRoleSchema>;

export const deleteUserSchema = z.object({
  userId: z.string().min(1),
});

export type DeleteUserType = z.infer<typeof deleteUserSchema>;

export const wallpaperVisibilitySchema = z.object({
  wallpaperId: z.string().min(1),
  isPublic: z.boolean(),
});

export type WallpaperVisibilityType = z.infer<typeof wallpaperVisibilitySchema>;

// ── Reports (admin + flag flow) ──────────────────────
export const reportsSearchParamsSchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  reason: z
    .enum(["ALL", "SPAM", "NUDITY", "COPYRIGHT", "VIOLENCE", "OTHER"])
    .optional()
    .default("ALL"),
  reportStatus: z
    .enum(["PENDING", "RESOLVED", "DISMISSED", "ALL"])
    .optional()
    .default("PENDING"),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
});

export type ReportsSearchParamsType = z.infer<typeof reportsSearchParamsSchema>;

export const createReportSchema = z.object({
  wallpaperId: z.string().min(1),
  reason: reportReasonSchema,
  details: z.string().trim().max(2000).optional().default(""),
});

export type CreateReportType = z.infer<typeof createReportSchema>;

// ── Collections (admin, editorial) ───────────────────
const collectionSlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const collectionsSearchParamsSchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  status: z.enum(["all", "active", "hidden"]).optional().default("all"),
  sort: z.enum(["newest", "manual"]).optional().default("manual"),
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
});

export type CollectionsSearchParamsType = z.infer<
  typeof collectionsSearchParamsSchema
>;

export const collectionCreateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(collectionSlugRegex, {
      error: "Slug must be lowercase letters, numbers, hyphens",
    })
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  active: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional().default(0),
});

export type CollectionCreateType = z.infer<typeof collectionCreateSchema>;

export const collectionUpdateSchema = collectionCreateSchema.extend({
  id: z.cuid(),
});

export type CollectionUpdateType = z.infer<typeof collectionUpdateSchema>;

export const collectionItemSchema = z.object({
  collectionId: z.string().min(1),
  wallpaperId: z.string().min(1),
  note: z.string().trim().max(1000).optional().default(""),
});

export type CollectionItemType = z.infer<typeof collectionItemSchema>;

export const collectionReorderSchema = z.object({
  collectionId: z.string().min(1),
  wallpaperIds: z.array(z.string().min(1)).min(1).max(100),
});

export type CollectionReorderType = z.infer<typeof collectionReorderSchema>;

export const wallpaperFlagsSchema = z.object({
  wallpaperId: z.string().min(1),
  featured: z.boolean(),
  editorsPick: z.boolean(),
});

export type WallpaperFlagsType = z.infer<typeof wallpaperFlagsSchema>;

// ── Featured (admin) ─────────────────────────────────
export const featuredSearchParamsSchema = z.object({
  tab: z.enum(["flags", "placements"]).optional().default("flags"),
  q: z.string().trim().max(100).optional().default(""),
  flag: z.enum(["all", "featured", "pick", "both"]).optional().default("all"),
  placement: z
    .enum(["ALL", "HERO", "TRENDING", "SEASONAL"])
    .optional()
    .default("ALL"),
  window: z
    .enum(["active", "upcoming", "expired", "all"])
    .optional()
    .default("active"),
  sort: z.enum(["newest", "priority"]).optional().default("priority"),
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
});

export type FeaturedSearchParamsType = z.infer<
  typeof featuredSearchParamsSchema
>;

export const placementSchema = z.object({
  wallpaperId: z.string().min(1),
  placement: z.enum(["HERO", "TRENDING", "SEASONAL"]),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().optional(),
  priority: z.coerce.number().int().min(0).max(100000).optional().default(0),
  active: z.boolean().optional().default(true),
});

export type PlacementType = z.infer<typeof placementSchema>;

export const placementUpdateSchema = placementSchema.extend({
  id: z.cuid(),
});

export type PlacementUpdateType = z.infer<typeof placementUpdateSchema>;

// ── Analytics (admin, read-only) ─────────────────────
export const analyticsSearchParamsSchema = z.object({
  range: z.enum(["7", "30", "90"]).optional().default("30"),
});

export type AnalyticsSearchParamsType = z.infer<
  typeof analyticsSearchParamsSchema
>;
