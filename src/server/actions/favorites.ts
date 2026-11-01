"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { browseDownloadSchema } from "@/lib/zodSchema";

export async function toggleFavorite(input: unknown) {
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

  const wallpaper = await prisma.wallpaper.findFirst({
    where: {
      id: parsed.data.wallpaperId,
      isApproved: true,
      isPublic: true,
    },
    select: { id: true },
  });
  if (!wallpaper) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_wallpaperId: {
        userId: session.user.id,
        wallpaperId: wallpaper.id,
      },
    },
    select: { wallpaperId: true },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: {
        userId_wallpaperId: {
          userId: session.user.id,
          wallpaperId: wallpaper.id,
        },
      },
    });
  } else {
    await prisma.favorite.create({
      data: {
        userId: session.user.id,
        wallpaperId: wallpaper.id,
      },
    });
  }

  const favoriteCount = await prisma.favorite.count({
    where: { wallpaperId: wallpaper.id },
  });

  revalidatePath("/dashboard");

  return {
    success: true as const,
    favorited: !existing,
    favoriteCount,
  };
}
