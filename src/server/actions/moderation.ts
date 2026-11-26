"use server";

import { revalidatePath } from "next/cache";
import { getActiveSession, requireAdminAction } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { deleteManyFromS3, extractS3Key } from "@/lib/fileStorage";
import { recordAdminAuditLog } from "@/lib/security/auditLog";
import { consumeRateLimit } from "@/lib/security/rateLimit";
import {
  banUserSchema,
  bulkReviewSchema,
  createReportSchema,
  hardDeleteWallpaperSchema,
  moderationReviewSchema,
  reportResolveSchema,
} from "@/lib/zodSchema";
import { isPrimaryAdminEmail } from "@/server/admin";

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

export async function reviewWallpaper(input: unknown) {
  const authCheck = await requireAdminAction();
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

  await recordAdminAuditLog({
    actorId: reviewerId,
    action: `MODERATION_${decision}`,
    targetType: "wallpaper",
    targetId: wallpaperId,
    summary: `${decision === "APPROVED" ? "Approved" : "Rejected"} "${wallpaper.title}"`,
    ...(reviewNotes.trim() ? { metadata: { notes: reviewNotes.trim() } } : {}),
  });

  revalidatePath("/admin/moderation");
  revalidatePath("/admin/audit");
  revalidatePath("/admin");
  revalidatePath("/browse");
  revalidatePath("/upload");
  return { success: true as const };
}

export async function bulkReviewWallpapers(input: unknown) {
  const authCheck = await requireAdminAction();
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

  await recordAdminAuditLog({
    actorId: reviewerId,
    action: `MODERATION_BULK_${decision}`,
    targetType: "wallpaper",
    targetId: `${updated} items`,
    summary: `Bulk ${decision.toLowerCase()} ${updated} wallpaper submissions`,
    metadata: { count: updated, decision },
  });

  revalidatePath("/admin/moderation");
  revalidatePath("/admin/audit");
  revalidatePath("/admin");
  revalidatePath("/browse");
  revalidatePath("/upload");
  return { success: true as const, data: { updated } };
}

export async function setBan(input: unknown) {
  const authCheck = await requireAdminAction();
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
    select: { id: true, role: true, email: true },
  });
  if (!target) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }
  if (banned && isPrimaryAdminEmail(target.email)) {
    return { success: false as const, error: "PROTECTED_ADMIN" as const };
  }
  if (banned && target.role === "admin") {
    return { success: false as const, error: "CANNOT_BAN_ADMIN" as const };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        banned,
        banReason: banned ? banReason.trim() : null,
        banExpires: banned ? (banExpires ?? null) : null,
      },
    }),
    ...(banned ? [prisma.session.deleteMany({ where: { userId } })] : []),
  ]);

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: banned ? "USER_BAN" : "USER_UNBAN",
    targetType: "user",
    targetId: userId,
    summary: `${banned ? "Banned" : "Unbanned"} ${target.email}`,
    ...(banned ? { metadata: { reason: banReason.trim() } } : {}),
  });

  revalidatePath("/admin/moderation");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/audit");
  return { success: true as const };
}

export async function resolveReport(input: unknown) {
  const authCheck = await requireAdminAction();
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
    include: { wallpaper: { select: { title: true } } },
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

  await recordAdminAuditLog({
    actorId: reviewerId,
    action: `REPORT_${decision}`,
    targetType: "report",
    targetId: reportId,
    summary: `${decision === "RESOLVED" ? "Resolved" : "Dismissed"} report on "${report.wallpaper.title}"${hideWallpaper ? " (wallpaper hidden)" : ""}`,
  });

  revalidatePath("/admin/moderation");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/audit");
  revalidatePath("/browse");
  return { success: true as const };
}

export async function hardDeleteWallpaper(input: unknown) {
  const authCheck = await requireAdminAction();
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
      title: true,
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

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "WALLPAPER_HARD_DELETE",
    targetType: "wallpaper",
    targetId: wallpaper.id,
    summary: `Permanently deleted "${wallpaper.title}"`,
  });

  revalidatePath("/admin/moderation");
  revalidatePath("/admin/audit");
  revalidatePath("/admin");
  revalidatePath("/browse");
  return { success: true as const };
}

export async function createReport(input: unknown) {
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const, error: "UNAUTHORIZED" as const };
  }

  const rateCheck = await consumeRateLimit({
    key: `report:${session.user.id}`,
    limit: 15,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateCheck.allowed) {
    return { success: false as const, error: "RATE_LIMITED" as const };
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
  revalidatePath("/dashboard");
  return { success: true as const, data: { id: report.id } };
}
