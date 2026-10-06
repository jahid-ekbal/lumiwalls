"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { slugify } from "@/lib/slugify";
import {
  collectionCreateSchema,
  collectionItemSchema,
  collectionReorderSchema,
  collectionUpdateSchema,
  wallpaperFlagsSchema,
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

function revalidateCollections(id?: string) {
  revalidatePath("/admin/collections");
  if (id) {
    revalidatePath(`/admin/collections/${id}`);
  }
  revalidatePath("/browse");
}

export async function createCollection(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = collectionCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const slug =
    parsed.data.slug?.trim() ?
      parsed.data.slug.trim()
    : slugify(parsed.data.title);
  const existing = await prisma.collection.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing) {
    return { success: false as const, error: "SLUG_EXISTS" as const };
  }

  const collection = await prisma.collection.create({
    data: {
      title: parsed.data.title.trim(),
      slug,
      description: parsed.data.description?.trim() || null,
      active: parsed.data.active ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
      curatorId: authCheck.session.user.id,
    },
    select: { id: true },
  });

  revalidateCollections(collection.id);
  return { success: true as const, data: { id: collection.id } };
}

export async function updateCollection(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = collectionUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const slug =
    parsed.data.slug?.trim() ?
      parsed.data.slug.trim()
    : slugify(parsed.data.title);
  const conflict = await prisma.collection.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (conflict && conflict.id !== parsed.data.id) {
    return { success: false as const, error: "SLUG_EXISTS" as const };
  }

  const existing = await prisma.collection.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!existing) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  await prisma.collection.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title.trim(),
      slug,
      description: parsed.data.description?.trim() || null,
      active: parsed.data.active ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  revalidateCollections(parsed.data.id);
  return { success: true as const };
}

export async function deleteCollection(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = collectionUpdateSchema.pick({ id: true }).safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const existing = await prisma.collection.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!existing) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  await prisma.collection.delete({ where: { id: parsed.data.id } });

  revalidateCollections();
  return { success: true as const };
}

export async function addCollectionItem(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = collectionItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const collection = await prisma.collection.findUnique({
    where: { id: parsed.data.collectionId },
    select: { id: true },
  });
  if (!collection) {
    return { success: false as const, error: "COLLECTION_NOT_FOUND" as const };
  }

  const wallpaper =
    (await prisma.wallpaper.findUnique({
      where: { id: parsed.data.wallpaperId },
      select: { id: true, isApproved: true, isPublic: true },
    })) ??
    (await prisma.wallpaper.findUnique({
      where: { slug: parsed.data.wallpaperId },
      select: { id: true, isApproved: true, isPublic: true },
    }));
  if (!wallpaper || !wallpaper.isApproved || !wallpaper.isPublic) {
    return { success: false as const, error: "NOT_AVAILABLE" as const };
  }

  const duplicate = await prisma.collectionItem.findUnique({
    where: {
      collectionId_wallpaperId: {
        collectionId: parsed.data.collectionId,
        wallpaperId: wallpaper.id,
      },
    },
    select: { id: true },
  });
  if (duplicate) {
    return { success: false as const, error: "ALREADY_ADDED" as const };
  }

  const maxPosition = await prisma.collectionItem.findFirst({
    where: { collectionId: parsed.data.collectionId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.collectionItem.create({
    data: {
      collectionId: parsed.data.collectionId,
      wallpaperId: wallpaper.id,
      position: (maxPosition?.position ?? -1) + 1,
      note: parsed.data.note.trim() || null,
    },
  });

  revalidateCollections(parsed.data.collectionId);
  return { success: true as const };
}

export async function removeCollectionItem(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = collectionItemSchema
    .pick({ collectionId: true, wallpaperId: true })
    .safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  await prisma.collectionItem.deleteMany({
    where: {
      collectionId: parsed.data.collectionId,
      wallpaperId: parsed.data.wallpaperId,
    },
  });

  revalidateCollections(parsed.data.collectionId);
  return { success: true as const };
}

export async function reorderCollectionItems(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = collectionReorderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const rows = await prisma.collectionItem.findMany({
    where: {
      collectionId: parsed.data.collectionId,
      wallpaperId: { in: parsed.data.wallpaperIds },
    },
    select: { wallpaperId: true },
  });
  if (rows.length !== parsed.data.wallpaperIds.length) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  await prisma.$transaction(
    parsed.data.wallpaperIds.map((wallpaperId, position) =>
      prisma.collectionItem.update({
        where: {
          collectionId_wallpaperId: {
            collectionId: parsed.data.collectionId,
            wallpaperId,
          },
        },
        data: { position },
      }),
    ),
  );

  revalidateCollections(parsed.data.collectionId);
  return { success: true as const };
}

export async function setCollectionCover(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = collectionItemSchema
    .pick({ collectionId: true, wallpaperId: true })
    .safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const wallpaper = await prisma.wallpaper.findUnique({
    where: { id: parsed.data.wallpaperId },
    select: { thumb800Url: true, thumb400Url: true, originalUrl: true },
  });
  if (!wallpaper) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  const cover =
    wallpaper.thumb800Url ?? wallpaper.thumb400Url ?? wallpaper.originalUrl;
  await prisma.collection.update({
    where: { id: parsed.data.collectionId },
    data: { coverUrl: cover },
  });

  revalidateCollections(parsed.data.collectionId);
  return { success: true as const };
}

export async function setWallpaperFlags(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = wallpaperFlagsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const wallpaper = await prisma.wallpaper.findUnique({
    where: { id: parsed.data.wallpaperId },
    select: { id: true, isApproved: true, isPublic: true },
  });
  if (!wallpaper || !wallpaper.isApproved || !wallpaper.isPublic) {
    return { success: false as const, error: "NOT_AVAILABLE" as const };
  }

  await prisma.wallpaper.update({
    where: { id: wallpaper.id },
    data: {
      featured: parsed.data.featured,
      editorsPick: parsed.data.editorsPick,
    },
  });

  revalidatePath("/admin/collections");
  revalidatePath("/admin/featured");
  revalidatePath("/browse");
  return { success: true as const };
}
