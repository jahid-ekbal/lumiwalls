"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@generated/prisma/client";
import { getActiveSession } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { browseDownloadSchema } from "@/lib/zodSchema";

export async function toggleFavorite(input: unknown) {
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

  let favorited = false;
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
    try {
      await prisma.favorite.delete({
        where: {
          userId_wallpaperId: {
            userId: session.user.id,
            wallpaperId: wallpaper.id,
          },
        },
      });
      favorited = false;
    } catch (error) {
      if (
        !(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2025"
        )
      ) {
        throw error;
      }
      favorited = false;
    }
  } else {
    try {
      await prisma.favorite.create({
        data: {
          userId: session.user.id,
          wallpaperId: wallpaper.id,
        },
      });
      favorited = true;
    } catch (error) {
      if (
        !(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        )
      ) {
        throw error;
      }
      favorited = true;
    }
  }

  const favoriteCount = await prisma.favorite.count({
    where: { wallpaperId: wallpaper.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return {
    success: true as const,
    favorited,
    favoriteCount,
  };
}
