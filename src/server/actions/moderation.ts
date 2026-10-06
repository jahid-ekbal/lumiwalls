"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { deleteManyFromS3 } from "@/lib/fileStorage";
import {
  banUserSchema,
  bulkReviewSchema,
  createReportSchema,
  hardDeleteWallpaperSchema,
  moderationReviewSchema,
  reportResolveSchema,
} from "@/lib/zodSchema";

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return { authorized: false as const, error: "UNAUTHORIZED" as const };
  }
  if (session.user.role !== "admin") {
    return { authorized: false as const, error: "FORBIDDEN" as const };
  }
  return { authorized: true as const, session };
}

function combineNotes(existing: string | null, next: string): string | null {
  const trimmed = next.trim();
  if (!trimmed) {
    return existing;
  }
  if (!existing?.trim()) {
    return trimmed;
  }
  if (existing.includes(trimmed)) {
    return existing;
  }
  return `${existing}\n---\n${trimmed}`;
}

function extractS3Key(url: string | null): string | null {
  if (!url) {
    return null;
  }
  const marker = "/api/images/";
  const index = url.indexOf(marker);
  if (index === -1) {
    return url.startsWith("wallpapers/") ? url : null;
  }
  return url.slice(index + marker.length);
}

export async function reviewWallpaper(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = moderationReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const { wallpaperId, decision, reviewNotes } = parsed.data;
  if (decision === "REJECTED" && !reviewNotes.trim()) {
    return { success: false as const, error: "NOTES_REQUIRED" as const };
  }

  const wallpaper = await prisma.wallpaper.findUnique({
    where: { id: wallpaperId },
    include: { moderationQueue: true },
  });
  if (!wallpaper) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  const reviewerId = authCheck.session.user.id;
  const now = new Date();

  await prisma.$transaction([
    prisma.wallpaper.update({
      where: { id: wallpaperId },
      data: { isApproved: decision === "APPROVED" },
    }),
    prisma.moderationQueue.upsert({
      where: { wallpaperId },
      create: {
        wallpaperId,
        status: decision,
        reviewerId,
        reviewNotes: reviewNotes.trim() || null,
        reviewedAt: now,
      },
      update: {
        status: decision,
        reviewerId,
        reviewNotes: combineNotes(
          wallpaper.moderationQueue?.reviewNotes ?? null,
          reviewNotes,
        ),
        reviewedAt: now,
      },
    }),
  ]);

  revalidatePath("/admin/moderation");
  revalidatePath("/admin");
  revalidatePath("/browse");
  return { success: true as const };
}

export async function bulkReviewWallpapers(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = bulkReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const { wallpaperIds, decision, reviewNotes } = parsed.data;
  if (decision === "REJECTED" && !reviewNotes.trim()) {
    return { success: false as const, error: "NOTES_REQUIRED" as const };
  }

  const reviewerId = authCheck.session.user.id;
  const now = new Date();
  let updated = 0;

  for (const wallpaperId of wallpaperIds) {
    const wallpaper = await prisma.wallpaper.findUnique({
      where: { id: wallpaperId },
      include: { moderationQueue: true },
    });
    if (!wallpaper) {
      continue;
    }
    await prisma.$transaction([
      prisma.wallpaper.update({
        where: { id: wallpaperId },
        data: { isApproved: decision === "APPROVED" },
      }),
      prisma.moderationQueue.upsert({
        where: { wallpaperId },
        create: {
          wallpaperId,
          status: decision,
          reviewerId,
          reviewNotes: reviewNotes.trim() || null,
          reviewedAt: now,
        },
        update: {
          status: decision,
          reviewerId,
          reviewNotes: combineNotes(
            wallpaper.moderationQueue?.reviewNotes ?? null,
            reviewNotes,
          ),
          reviewedAt: now,
        },
      }),
    ]);
    updated += 1;
  }

  revalidatePath("/admin/moderation");
  revalidatePath("/admin");
  revalidatePath("/browse");
  return { success: true as const, data: { updated } };
}

export async function setBan(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = banUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const { userId, banned, banReason, banExpires } = parsed.data;
  if (userId === authCheck.session.user.id) {
    return { success: false as const, error: "CANNOT_BAN_SELF" as const };
  }
  if (banned && !banReason.trim()) {
    return { success: false as const, error: "REASON_REQUIRED" as const };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }
  if (target.role === "admin") {
    return { success: false as const, error: "CANNOT_BAN_ADMIN" as const };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      banned,
      banReason: banned ? banReason.trim() : null,
      banExpires: banned ? (banExpires ?? null) : null,
    },
  });

  if (banned) {
    await prisma.session.deleteMany({ where: { userId } });
  }

  revalidatePath("/admin/moderation");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true as const };
}

export async function resolveReport(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = reportResolveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const { reportId, decision, hideWallpaper } = parsed.data;
  const report = await prisma.report.findUnique({
    where: { id: reportId },
  });
  if (!report) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  const reviewerId = authCheck.session.user.id;
  const now = new Date();

  await prisma.$transaction([
    prisma.report.update({
      where: { id: reportId },
      data: {
        status: decision,
        reviewerId,
        reviewedAt: now,
      },
    }),
    ...(hideWallpaper ?
      [
        prisma.wallpaper.update({
          where: { id: report.wallpaperId },
          data: { isPublic: false },
        }),
      ]
    : []),
  ]);

  revalidatePath("/admin/moderation");
  revalidatePath("/admin/reports");
  revalidatePath("/browse");
  return { success: true as const };
}

export async function hardDeleteWallpaper(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = hardDeleteWallpaperSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const wallpaper = await prisma.wallpaper.findUnique({
    where: { id: parsed.data.wallpaperId },
    select: {
      id: true,
      originalUrl: true,
      thumb400Url: true,
      thumb800Url: true,
      thumb1920Url: true,
    },
  });
  if (!wallpaper) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  const keys = [
    extractS3Key(wallpaper.originalUrl),
    extractS3Key(wallpaper.thumb400Url),
    extractS3Key(wallpaper.thumb800Url),
    extractS3Key(wallpaper.thumb1920Url),
  ].filter((key): key is string => Boolean(key));

  if (keys.length > 0) {
    await deleteManyFromS3(keys);
  }
  await prisma.wallpaper.delete({ where: { id: wallpaper.id } });

  revalidatePath("/admin/moderation");
  revalidatePath("/admin");
  revalidatePath("/browse");
  return { success: true as const };
}

export async function createReport(input: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return { success: false as const, error: "UNAUTHORIZED" as const };
  }

  const parsed = createReportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const { wallpaperId, reason, details } = parsed.data;
  if (reason === "OTHER" && !details.trim()) {
    return { success: false as const, error: "DETAILS_REQUIRED" as const };
  }

  const wallpaper = await prisma.wallpaper.findUnique({
    where: { id: wallpaperId },
    select: { id: true, uploaderId: true, isApproved: true, isPublic: true },
  });
  if (!wallpaper || !wallpaper.isApproved || !wallpaper.isPublic) {
    return { success: false as const, error: "NOT_AVAILABLE" as const };
  }
  if (wallpaper.uploaderId === session.user.id) {
    return { success: false as const, error: "CANNOT_REPORT_OWN" as const };
  }

  const existing = await prisma.report.findFirst({
    where: {
      wallpaperId,
      reporterId: session.user.id,
      status: "PENDING",
    },
    select: { id: true },
  });
  if (existing) {
    return { success: false as const, error: "ALREADY_REPORTED" as const };
  }

  const report = await prisma.report.create({
    data: {
      wallpaperId,
      reporterId: session.user.id,
      reason,
      details: details.trim() || null,
      status: "PENDING",
    },
    select: { id: true },
  });

  revalidatePath("/admin/moderation");
  revalidatePath("/admin/reports");
  return { success: true as const, data: { id: report.id } };
}
