"use server";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Prisma } from "@generated/prisma/client";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import {
  buildKey,
  deleteManyFromS3,
  sanitizeFileName,
} from "@/lib/fileStorage";
import { slugify } from "@/lib/slugify";
import { getOneHourAgo } from "@/lib/uploadExpiry";
import { s3Client } from "@/lib/storage/b2Client";
import { generateThumbsAndUpload } from "@/lib/storage/imageProcessor";
import { generatePresignedUploadUrl } from "@/lib/storage/presignedUrl";
import {
  MAX_UPLOAD_SIZE,
  finalizeUploadSchema,
  initiateUploadSchema,
} from "@/lib/zodSchema";

const buildPublicUrl = (key: string): string => {
  const base = serverEnv.BETTER_AUTH_URL;
  return `${base.replace(/\/$/, "")}/api/images/${key.replace(/^\//, "")}`;
};

const deriveThumbKeys = (originalKey: string) => {
  const parts = originalKey.split("/");
  const fileName = parts[parts.length - 1] ?? "";
  const match = fileName.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
  const uuid = match?.[0] ?? (fileName.split("-")[0] || crypto.randomUUID());
  const base = parts.slice(0, -1).join("/");
  return {
    thumb400: `${base}/thumb-400-${uuid}.webp`,
    thumb800: `${base}/thumb-800-${uuid}.webp`,
    thumb1920: `${base}/thumb-1920-${uuid}.webp`,
  };
};

const deleteWallpaperOrphan = async (
  wallpaperId: string,
  s3Keys: string[],
): Promise<void> => {
  if (s3Keys.length > 0) {
    await deleteManyFromS3(s3Keys);
  }
  try {
    await prisma.wallpaper.delete({ where: { id: wallpaperId } });
  } catch {
    return;
  }
};

const cleanupStaleUploads = async (userId: string): Promise<void> => {
  const oneHourAgo = getOneHourAgo();
  const stale = await prisma.wallpaper.findMany({
    where: {
      uploaderId: userId,
      createdAt: { lt: oneHourAgo },
      thumb400Url: null,
      moderationQueue: { status: "PENDING" },
    },
    select: { id: true, originalUrl: true },
    take: 20,
  });
  for (const row of stale) {
    const keys = row.originalUrl ? [row.originalUrl] : [];
    await deleteWallpaperOrphan(row.id, keys);
  }
};

const buildWallpaperSlug = (title: string): string => {
  const base = slugify(title) || "wallpaper";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
};

export async function initiateUpload(input: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return { success: false as const, error: "UNAUTHORIZED" };
  }

  const parsed = initiateUploadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR",
      issues: parsed.error.issues,
    };
  }

  const {
    title,
    description,
    categoryId,
    tagIds: rawTagIds,
    fileName,
    mimeType,
  } = parsed.data;
  const tagIds = [...new Set(rawTagIds)];

  await cleanupStaleUploads(session.user.id);

  const oneHourAgo = getOneHourAgo();
  const recentCount = await prisma.wallpaper.count({
    where: {
      uploaderId: session.user.id,
      createdAt: { gte: oneHourAgo },
      thumb400Url: { not: null },
    },
  });
  if (recentCount >= 5) {
    return { success: false as const, error: "RATE_LIMITED" };
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    return { success: false as const, error: "INVALID_CATEGORY" };
  }

  if (tagIds.length > 0) {
    const existingTags = await prisma.tag.findMany({
      where: { id: { in: tagIds } },
      select: { id: true },
    });
    if (existingTags.length !== tagIds.length) {
      return { success: false as const, error: "INVALID_TAG" };
    }
  }

  const sanitized = sanitizeFileName(fileName);
  const keys = buildKey(session.user.id, sanitized);

  let wallpaper: { id: string; slug: string };
  try {
    let slug = buildWallpaperSlug(title);
    let attempts = 0;
    for (;;) {
      try {
        const created = await prisma.wallpaper.create({
          data: {
            title,
            slug,
            description: description ?? null,
            originalUrl: keys.original,
            categoryId,
            uploaderId: session.user.id,
            isPublic: true,
            isApproved: false,
            tags: {
              create: tagIds.map((tagId) => ({ tagId })),
            },
            moderationQueue: {
              create: { status: "PENDING" },
            },
          },
          select: { id: true, slug: true },
        });
        wallpaper = created;
        break;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          attempts < 3
        ) {
          attempts += 1;
          slug = buildWallpaperSlug(title);
          continue;
        }
        throw error;
      }
    }
  } catch {
    return { success: false as const, error: "STORAGE_ERROR" };
  }

  try {
    const { url, key } = await generatePresignedUploadUrl(
      keys.original,
      mimeType,
    );
    return {
      success: true as const,
      data: {
        wallpaperId: wallpaper.id,
        slug: wallpaper.slug,
        key,
        url,
        expiresIn: 300,
      },
    };
  } catch {
    await deleteWallpaperOrphan(wallpaper.id, []);
    return { success: false as const, error: "STORAGE_ERROR" };
  }
}

export async function finalizeUpload(input: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return { success: false as const, error: "UNAUTHORIZED" };
  }

  const parsed = finalizeUploadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR",
      issues: parsed.error.issues,
    };
  }

  const { wallpaperId, key } = parsed.data;

  const wallpaper = await prisma.wallpaper.findUnique({
    where: { id: wallpaperId },
    include: { moderationQueue: true },
  });

  if (!wallpaper) {
    return { success: false as const, error: "NOT_FOUND" };
  }
  if (wallpaper.uploaderId !== session.user.id) {
    return { success: false as const, error: "FORBIDDEN" };
  }

  const thumbKeys = deriveThumbKeys(key);
  const expectedOriginalUrl = buildPublicUrl(key);
  const isAlreadyFinalized =
    wallpaper.originalUrl === expectedOriginalUrl &&
    wallpaper.thumb400Url !== null;

  if (isAlreadyFinalized) {
    return {
      success: true as const,
      data: {
        wallpaperId: wallpaper.id,
        slug: wallpaper.slug,
        originalUrl: wallpaper.originalUrl,
        thumb400Url: wallpaper.thumb400Url,
        thumb800Url: wallpaper.thumb800Url,
        thumb1920Url: wallpaper.thumb1920Url,
      },
    };
  }

  if (wallpaper.originalUrl !== key) {
    return { success: false as const, error: "KEY_MISMATCH" };
  }

  let objectBuffer: Buffer;
  try {
    const command = new GetObjectCommand({
      Bucket: serverEnv.S3_BUCKET_NAME,
      Key: key,
    });
    const response = await s3Client.send(command);
    if (!response.Body) {
      await deleteWallpaperOrphan(wallpaperId, [key]);
      return { success: false as const, error: "OBJECT_NOT_FOUND" };
    }
    const byteArray = await response.Body.transformToByteArray();
    objectBuffer = Buffer.from(byteArray);
  } catch {
    await deleteWallpaperOrphan(wallpaperId, [key]);
    return { success: false as const, error: "OBJECT_NOT_FOUND" };
  }

  if (
    objectBuffer.byteLength < 1 ||
    objectBuffer.byteLength > MAX_UPLOAD_SIZE
  ) {
    await deleteWallpaperOrphan(wallpaperId, [key]);
    return { success: false as const, error: "FILE_TOO_LARGE" };
  }

  let processed: {
    blurDataUrl: string;
    metadata: {
      width: number;
      height: number;
      format: string;
      fileSize: number;
    };
    aspectRatio: string;
  };

  try {
    processed = await generateThumbsAndUpload(objectBuffer, thumbKeys);
  } catch (error) {
    await deleteWallpaperOrphan(wallpaperId, [
      key,
      thumbKeys.thumb400,
      thumbKeys.thumb800,
      thumbKeys.thumb1920,
    ]);
    return {
      success: false as const,
      error: "PROCESSING_FAILED",
      details: error instanceof Error ? error.message : String(error),
    };
  }

  const publicOriginalUrl = buildPublicUrl(key);
  const publicThumb400 = buildPublicUrl(thumbKeys.thumb400);
  const publicThumb800 = buildPublicUrl(thumbKeys.thumb800);
  const publicThumb1920 = buildPublicUrl(thumbKeys.thumb1920);

  let updated;
  try {
    updated = await prisma.wallpaper.update({
      where: { id: wallpaperId },
      data: {
        originalUrl: publicOriginalUrl,
        thumb400Url: publicThumb400,
        thumb800Url: publicThumb800,
        thumb1920Url: publicThumb1920,
        blurDataUrl: processed.blurDataUrl,
        width: processed.metadata.width,
        height: processed.metadata.height,
        format: processed.metadata.format,
        fileSize: processed.metadata.fileSize,
        aspectRatio: processed.aspectRatio,
        aspectRatioValue:
          processed.metadata.width && processed.metadata.height ?
            processed.metadata.width / processed.metadata.height
          : null,
      },
    });
  } catch {
    await deleteManyFromS3([
      thumbKeys.thumb400,
      thumbKeys.thumb800,
      thumbKeys.thumb1920,
    ]);
    return { success: false as const, error: "STORAGE_ERROR" };
  }

  if (updated.pHash) {
    const existingWithHash = await prisma.wallpaper.findMany({
      where: {
        pHash: { not: null },
        id: { not: wallpaperId },
      },
      select: { pHash: true },
      take: 100,
    });

    const isDuplicate = existingWithHash.some((w) => w.pHash === updated.pHash);
    if (isDuplicate && wallpaper.moderationQueue) {
      await prisma.moderationQueue.update({
        where: { wallpaperId },
        data: {
          reviewNotes: "Flagged as potential duplicate (pHash match)",
        },
      });
    }
  }

  return {
    success: true as const,
    data: {
      wallpaperId: updated.id,
      slug: updated.slug,
      originalUrl: updated.originalUrl,
      thumb400Url: updated.thumb400Url,
      thumb800Url: updated.thumb800Url,
      thumb1920Url: updated.thumb1920Url,
    },
  };
}
