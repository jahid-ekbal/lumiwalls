"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { browseDownloadSchema } from "@/lib/zodSchema";

export async function incrementDownloadCount(input: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
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
    select: { id: true },
  });
  if (!existing) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  const updated = await prisma.wallpaper.update({
    where: { id: existing.id },
    data: { downloadCount: { increment: 1 } },
    select: { id: true, downloadCount: true },
  });

  revalidatePath("/browse");

  return {
    success: true as const,
    downloadCount: updated.downloadCount,
  };
}
