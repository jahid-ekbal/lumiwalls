"use server";

import { revalidatePath } from "next/cache";
import { getActiveSession } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { consumeRateLimit } from "@/lib/security/rateLimit";
import { browseDownloadSchema } from "@/lib/zodSchema";

export async function incrementDownloadCount(input: unknown) {
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const, error: "UNAUTHORIZED" as const };
  }

  const parsed = browseDownloadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const existing = await prisma.wallpaper.findFirst({
    where: {
      id: parsed.data.wallpaperId,
      isApproved: true,
      isPublic: true,
    },
    select: { id: true, downloadCount: true },
  });
  if (!existing) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  const rateCheck = await consumeRateLimit({
    key: `dl:${session.user.id}:${existing.id}`,
    limit: 6,
    windowMs: 60_000,
  });
  if (!rateCheck.allowed) {
    return {
      success: true as const,
      downloadCount: existing.downloadCount,
    };
  }

  const [updated] = await prisma.$transaction([
    prisma.wallpaper.update({
      where: { id: existing.id },
      data: { downloadCount: { increment: 1 } },
      select: { id: true, downloadCount: true },
    }),
    prisma.downloadLog.create({
      data: {
        wallpaperId: existing.id,
        userId: session.user.id,
        variant: parsed.data.variant ?? "original",
      },
    }),
  ]);

  revalidatePath("/browse");
  revalidatePath("/dashboard");

  return {
    success: true as const,
    downloadCount: updated.downloadCount,
  };
}

export async function trackWallpaperView(input: unknown) {
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const };
  }

  const parsed = browseDownloadSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const };
  }

  const existing = await prisma.wallpaper.findFirst({
    where: {
      id: parsed.data.wallpaperId,
      isApproved: true,
      isPublic: true,
    },
    select: { id: true },
  });
  if (!existing) {
    return { success: false as const };
  }

  const rateCheck = await consumeRateLimit({
    key: `view:${session.user.id}:${existing.id}`,
    limit: 1,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateCheck.allowed) {
    return { success: true as const };
  }

  await prisma.$transaction([
    prisma.wallpaper.update({
      where: { id: existing.id },
      data: { viewCount: { increment: 1 } },
    }),
    prisma.viewLog.create({
      data: {
        wallpaperId: existing.id,
        userId: session.user.id,
      },
    }),
  ]);

  return { success: true as const };
}
