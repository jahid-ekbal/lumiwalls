"use server";

import { revalidatePath } from "next/cache";
import { getActiveSession } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { consumeRateLimit } from "@/lib/security/rateLimit";
import { slugify } from "@/lib/slugify";
import {
  boardToggleItemSchema,
  personalBoardCreateSchema,
  personalBoardUpdateSchema,
} from "@/lib/zodSchema";

function revalidateBoards(slug?: string) {
  revalidatePath("/collections");
  if (slug) {
    revalidatePath(`/collections/${slug}`);
  }
  revalidatePath("/profile");
  revalidatePath("/browse");
}

export async function createPersonalBoard(input: unknown) {
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const, error: "UNAUTHORIZED" as const };
  }

  const rateCheck = await consumeRateLimit({
    key: `board-create:${session.user.id}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateCheck.allowed) {
    return { success: false as const, error: "RATE_LIMITED" as const };
  }

  const parsed = personalBoardCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const count = await prisma.collection.count({
    where: { ownerId: session.user.id },
  });
  if (count >= 40) {
    return { success: false as const, error: "BOARD_LIMIT_REACHED" as const };
  }

  const baseSlug = slugify(parsed.data.title) || "board";
  const slug = `${baseSlug.slice(0, 72)}-${crypto.randomUUID().slice(0, 6)}`;

  const board = await prisma.collection.create({
    data: {
      title: parsed.data.title.trim(),
      slug,
      description: parsed.data.description?.trim() || null,
      active: true,
      isCurated: false,
      isPublicToMembers: parsed.data.isPublicToMembers ?? true,
      ownerId: session.user.id,
      sortOrder: count,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      isPublicToMembers: true,
    },
  });

  revalidateBoards(board.slug);
  return { success: true as const, data: board };
}

export async function updatePersonalBoard(input: unknown) {
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const, error: "UNAUTHORIZED" as const };
  }

  const parsed = personalBoardUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const existing = await prisma.collection.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, slug: true, ownerId: true, isCurated: true },
  });
  if (!existing || existing.isCurated || existing.ownerId !== session.user.id) {
    return { success: false as const, error: "FORBIDDEN" as const };
  }

  await prisma.collection.update({
    where: { id: existing.id },
    data: {
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      isPublicToMembers: parsed.data.isPublicToMembers ?? true,
    },
  });

  revalidateBoards(existing.slug);
  return { success: true as const };
}

export async function deletePersonalBoard(input: unknown) {
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const, error: "UNAUTHORIZED" as const };
  }

  const parsed = personalBoardUpdateSchema.pick({ id: true }).safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
    };
  }

  const existing = await prisma.collection.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, slug: true, ownerId: true, isCurated: true },
  });
  if (!existing || existing.isCurated || existing.ownerId !== session.user.id) {
    return { success: false as const, error: "FORBIDDEN" as const };
  }

  await prisma.collection.delete({ where: { id: existing.id } });

  revalidateBoards(existing.slug);
  return { success: true as const };
}

export async function toggleWallpaperInBoard(input: unknown) {
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const, error: "UNAUTHORIZED" as const };
  }

  const parsed = boardToggleItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
    };
  }

  const [board, wallpaper] = await Promise.all([
    prisma.collection.findUnique({
      where: { id: parsed.data.collectionId },
      select: {
        id: true,
        slug: true,
        ownerId: true,
        isCurated: true,
        coverUrl: true,
      },
    }),
    prisma.wallpaper.findFirst({
      where: {
        id: parsed.data.wallpaperId,
        isApproved: true,
        isPublic: true,
      },
      select: {
        id: true,
        thumb800Url: true,
        thumb400Url: true,
      },
    }),
  ]);

  if (!board || board.isCurated || board.ownerId !== session.user.id) {
    return { success: false as const, error: "FORBIDDEN" as const };
  }
  if (!wallpaper) {
    return { success: false as const, error: "NOT_AVAILABLE" as const };
  }

  const existing = await prisma.collectionItem.findUnique({
    where: {
      collectionId_wallpaperId: {
        collectionId: board.id,
        wallpaperId: wallpaper.id,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.collectionItem.delete({ where: { id: existing.id } });
    revalidateBoards(board.slug);
    return { success: true as const, saved: false as const };
  }

  const maxPos = await prisma.collectionItem.findFirst({
    where: { collectionId: board.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.collectionItem.create({
    data: {
      collectionId: board.id,
      wallpaperId: wallpaper.id,
      position: (maxPos?.position ?? -1) + 1,
    },
  });

  if (!board.coverUrl) {
    const cover = wallpaper.thumb800Url ?? wallpaper.thumb400Url;
    if (cover) {
      await prisma.collection.update({
        where: { id: board.id },
        data: { coverUrl: cover },
      });
    }
  }

  revalidateBoards(board.slug);
  return { success: true as const, saved: true as const };
}
