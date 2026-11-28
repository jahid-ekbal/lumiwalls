"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { recordAdminAuditLog } from "@/lib/security/auditLog";
import { slugify } from "@/lib/slugify";
import {
  collectionCreateSchema,
  collectionItemSchema,
  collectionReorderSchema,
  collectionUpdateSchema,
  wallpaperFlagsSchema,
} from "@/lib/zodSchema";

function revalidateCollections(id?: string, slug?: string) {
  revalidatePath("/admin/collections");
  if (id) {
    revalidatePath(`/admin/collections/${id}`);
  }
  revalidatePath("/collections");
  if (slug) {
    revalidatePath(`/collections/${slug}`);
  }
  revalidatePath("/browse");
}

export async function createCollection(input: unknown) {
  const authCheck = await requireAdminAction();
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
      isCurated: true,
      isPublicToMembers: parsed.data.active ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
      curatorId: authCheck.session.user.id,
    },
    select: { id: true, slug: true },
  });

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "COLLECTION_CREATE",
    targetType: "collection",
    targetId: collection.id,
    summary: `Created curated collection "${parsed.data.title.trim()}"`,
  });

  revalidateCollections(collection.id, collection.slug);
  revalidatePath("/admin/audit");
  return { success: true as const, data: { id: collection.id } };
}

export async function updateCollection(input: unknown) {
  const authCheck = await requireAdminAction();
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
    select: { id: true, slug: true },
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
      isPublicToMembers: parsed.data.active ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "COLLECTION_UPDATE",
    targetType: "collection",
    targetId: parsed.data.id,
    summary: `Updated collection "${parsed.data.title.trim()}"`,
  });

  revalidateCollections(parsed.data.id, slug);
  revalidatePath("/admin/audit");
  return { success: true as const };
}

export async function deleteCollection(input: unknown) {
  const authCheck = await requireAdminAction();
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
    select: { id: true, title: true, slug: true },
  });
  if (!existing) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  await prisma.collection.delete({ where: { id: parsed.data.id } });

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "COLLECTION_DELETE",
    targetType: "collection",
    targetId: existing.id,
    summary: `Deleted collection "${existing.title}"`,
  });

  revalidateCollections(undefined, existing.slug);
  revalidatePath("/admin/audit");
  return { success: true as const };
}

export async function addCollectionItem(input: unknown) {
  const authCheck = await requireAdminAction();
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
    select: { id: true, title: true, slug: true },
  });
  if (!collection) {
    return { success: false as const, error: "COLLECTION_NOT_FOUND" as const };
  }

  const wallpaper =
    (await prisma.wallpaper.findUnique({
      where: { id: parsed.data.wallpaperId },
      select: { id: true, title: true, isApproved: true, isPublic: true },
    })) ??
    (await prisma.wallpaper.findUnique({
      where: { slug: parsed.data.wallpaperId },
      select: { id: true, title: true, isApproved: true, isPublic: true },
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

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "COLLECTION_ITEM_ADD",
    targetType: "collection",
    targetId: collection.id,
    summary: `Added "${wallpaper.title}" to "${collection.title}"`,
  });

  revalidateCollections(parsed.data.collectionId, collection.slug);
  revalidatePath("/admin/audit");
  return { success: true as const };
}

export async function removeCollectionItem(input: unknown) {
  const authCheck = await requireAdminAction();
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

  const existing = await prisma.collectionItem.findUnique({
    where: {
      collectionId_wallpaperId: {
        collectionId: parsed.data.collectionId,
        wallpaperId: parsed.data.wallpaperId,
      },
    },
    select: {
      id: true,
      collection: { select: { id: true, title: true, slug: true } },
      wallpaper: { select: { title: true } },
    },
  });
  if (!existing) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  await prisma.collectionItem.delete({ where: { id: existing.id } });

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "COLLECTION_ITEM_REMOVE",
    targetType: "collection",
    targetId: existing.collection.id,
    summary: `Removed "${existing.wallpaper.title}" from "${existing.collection.title}"`,
  });

  revalidateCollections(parsed.data.collectionId, existing.collection.slug);
  revalidatePath("/admin/audit");
  return { success: true as const };
}

export async function reorderCollectionItems(input: unknown) {
  const authCheck = await requireAdminAction();
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

  const collection = await prisma.collection.findUnique({
    where: { id: parsed.data.collectionId },
    select: { id: true, title: true, slug: true },
  });
  if (!collection) {
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

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "COLLECTION_REORDER",
    targetType: "collection",
    targetId: collection.id,
    summary: `Reordered items in "${collection.title}"`,
    metadata: { wallpaperIds: parsed.data.wallpaperIds },
  });

  revalidateCollections(parsed.data.collectionId, collection.slug);
  revalidatePath("/admin/audit");
  return { success: true as const };
}

export async function setCollectionCover(input: unknown) {
  const authCheck = await requireAdminAction();
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

  const collection = await prisma.collection.findUnique({
    where: { id: parsed.data.collectionId },
    select: { id: true, title: true, slug: true },
  });
  if (!collection) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  const item = await prisma.collectionItem.findUnique({
    where: {
      collectionId_wallpaperId: {
        collectionId: parsed.data.collectionId,
        wallpaperId: parsed.data.wallpaperId,
      },
    },
    select: {
      wallpaper: {
        select: {
          id: true,
          title: true,
          isApproved: true,
          isPublic: true,
          thumb800Url: true,
          thumb400Url: true,
          originalUrl: true,
        },
      },
    },
  });
  if (!item) {
    return {
      success: false as const,
      error: "ITEM_NOT_IN_COLLECTION" as const,
    };
  }
  const wallpaper = item.wallpaper;
  if (!wallpaper.isApproved || !wallpaper.isPublic) {
    return { success: false as const, error: "NOT_AVAILABLE" as const };
  }

  const cover =
    wallpaper.thumb800Url ?? wallpaper.thumb400Url ?? wallpaper.originalUrl;
  await prisma.collection.update({
    where: { id: parsed.data.collectionId },
    data: { coverUrl: cover },
  });

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "COLLECTION_COVER_UPDATE",
    targetType: "collection",
    targetId: collection.id,
    summary: `Set cover of "${collection.title}" to "${wallpaper.title}"`,
  });

  revalidateCollections(parsed.data.collectionId, collection.slug);
  revalidatePath("/admin/audit");
  return { success: true as const };
}

export async function setWallpaperFlags(input: unknown) {
  const authCheck = await requireAdminAction();
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
    select: { id: true, title: true, isApproved: true, isPublic: true },
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

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "WALLPAPER_FLAGS_UPDATE",
    targetType: "wallpaper",
    targetId: wallpaper.id,
    summary: `Updated flags on "${wallpaper.title}" (featured=${parsed.data.featured}, editorsPick=${parsed.data.editorsPick})`,
  });

  revalidatePath("/admin/collections");
  revalidatePath("/admin/featured");
  revalidatePath("/admin/audit");
  revalidatePath("/browse");
  return { success: true as const };
}

export async function searchApprovedWallpapers(query: string) {
  const authCheck = await requireAdminAction();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error, items: [] };
  }

  const trimmed = query.trim();
  const items = await prisma.wallpaper.findMany({
    where: {
      isApproved: true,
      isPublic: true,
      ...(trimmed ?
        {
          OR: [
            { title: { contains: trimmed, mode: "insensitive" } },
            { slug: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      title: true,
      slug: true,
      thumb400Url: true,
    },
  });

  return { success: true as const, items };
}
