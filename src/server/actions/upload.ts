"use server";

import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Prisma } from "@generated/prisma/client";
import { revalidatePath } from "next/cache";
import { getActiveSession } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import {
  buildKeyForFormat,
  deleteManyFromS3,
  extractS3Key,
} from "@/lib/fileStorage";
import { consumeRateLimit } from "@/lib/security/rateLimit";
import { slugify } from "@/lib/slugify";
import { s3Client } from "@/lib/storage/b2Client";
import { formatForMimeType } from "@/lib/storage/fileValidation";
import { generateThumbsAndUpload } from "@/lib/storage/imageProcessor";
import {
  DHASH_DUPLICATE_THRESHOLD,
  hammingDistanceHex,
} from "@/lib/storage/perceptualHash";
import { generatePresignedUploadUrl } from "@/lib/storage/presignedUrl";
import { getOneHourAgo } from "@/lib/uploadExpiry";
import {
  MAX_UPLOAD_SIZE,
  deleteOwnWallpaperSchema,
  finalizeUploadSchema,
  initiateUploadSchema,
  updateWallpaperMetadataSchema,
  wallpaperVisibilitySchema,
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
    take: 25,
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
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const, error: "UNAUTHORIZED" };
  }
  if (session.user.mustChangePassword) {
    return { success: false as const, error: "PASSWORD_CHANGE_REQUIRED" };
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
    mimeType,
    fileSize,
  } = parsed.data;
  const tagIds = [...new Set(rawTagIds)];
  const format = formatForMimeType(mimeType);
  if (!format) {
    return { success: false as const, error: "VALIDATION_ERROR" };
  }

  const rateCheck = await consumeRateLimit({
    key: `initiate-upload:${session.user.id}`,
    limit: 12,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateCheck.allowed) {
    return { success: false as const, error: "RATE_LIMITED" };
  }

  await cleanupStaleUploads(session.user.id);

  const oneHourAgo = getOneHourAgo();
  const [recentTotalCount, unfinalizedCount] = await Promise.all([
    prisma.wallpaper.count({
      where: {
        uploaderId: session.user.id,
        createdAt: { gte: oneHourAgo },
      },
    }),
    prisma.wallpaper.count({
      where: {
        uploaderId: session.user.id,
        thumb400Url: null,
      },
    }),
  ]);

  if (recentTotalCount >= 5) {
    return { success: false as const, error: "RATE_LIMITED" };
  }
  if (unfinalizedCount >= 5) {
    return { success: false as const, error: "RATE_LIMITED" };
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
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

  const keys = buildKeyForFormat(session.user.id, format);

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
      fileSize,
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
  const session = await getActiveSession();
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

  try {
    const head = await s3Client.send(
      new HeadObjectCommand({
        Bucket: serverEnv.S3_BUCKET_NAME,
        Key: key,
      }),
    );
    const contentLength = head.ContentLength ?? 0;
    if (contentLength < 1 || contentLength > MAX_UPLOAD_SIZE) {
      await deleteWallpaperOrphan(wallpaperId, [key]);
      return { success: false as const, error: "FILE_TOO_LARGE" };
    }
  } catch {
    await deleteWallpaperOrphan(wallpaperId, [key]);
    return { success: false as const, error: "OBJECT_NOT_FOUND" };
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

  let processed: Awaited<ReturnType<typeof generateThumbsAndUpload>>;
  try {
    processed = await generateThumbsAndUpload(objectBuffer, thumbKeys);
  } catch (error) {
    console.error("Wallpaper processing failed", {
      wallpaperId,
      message: error instanceof Error ? error.message : String(error),
    });
    await deleteWallpaperOrphan(wallpaperId, [
      key,
      thumbKeys.thumb400,
      thumbKeys.thumb800,
      thumbKeys.thumb1920,
    ]);
    return {
      success: false as const,
      error: "PROCESSING_FAILED",
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
        dominantColors: processed.dominantColors,
        pHash: processed.pHash,
      },
    });
  } catch {
    await deleteManyFromS3([
      key,
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
        thumb400Url: { not: null },
      },
      select: { id: true, slug: true, title: true, pHash: true },
      orderBy: { createdAt: "desc" },
      take: 400,
    });

    const matches = existingWithHash
      .filter(
        (candidate) =>
          candidate.pHash &&
          hammingDistanceHex(updated.pHash!, candidate.pHash) <=
            DHASH_DUPLICATE_THRESHOLD,
      )
      .slice(0, 3);

    if (matches.length > 0 && wallpaper.moderationQueue) {
      const matchSummary = matches
        .map((match) => `${match.title} (${match.slug})`)
        .join(", ");
      await prisma.moderationQueue.update({
        where: { wallpaperId },
        data: {
          reviewNotes: `Potential visual duplicate (dHash <= ${DHASH_DUPLICATE_THRESHOLD}): ${matchSummary}`,
        },
      });
    }
  }

  revalidatePath("/upload");
  revalidatePath("/dashboard");
  revalidatePath("/admin/moderation");

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

export async function updateWallpaperMetadata(input: unknown) {
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const, error: "UNAUTHORIZED" };
  }

  const parsed = updateWallpaperMetadataSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR",
      issues: parsed.error.issues,
    };
  }

  const {
    wallpaperId,
    title,
    description,
    categoryId,
    tagIds: rawTagIds,
  } = parsed.data;
  const tagIds = [...new Set(rawTagIds)];

  const wallpaper = await prisma.wallpaper.findUnique({
    where: { id: wallpaperId },
    select: {
      id: true,
      uploaderId: true,
      moderationQueue: { select: { status: true } },
    },
  });
  if (!wallpaper) {
    return { success: false as const, error: "NOT_FOUND" };
  }
  if (wallpaper.uploaderId !== session.user.id) {
    return { success: false as const, error: "FORBIDDEN" };
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
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

  const isRejected = wallpaper.moderationQueue?.status === "REJECTED";
  const normalizedDescription =
    description && description.length > 0 ? description : null;

  await prisma.$transaction([
    prisma.wallpaper.update({
      where: { id: wallpaperId },
      data: {
        title,
        description: normalizedDescription,
        categoryId,
        ...(isRejected ? { isApproved: false } : {}),
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    }),
    ...(isRejected ?
      [
        prisma.moderationQueue.upsert({
          where: { wallpaperId },
          create: { wallpaperId, status: "PENDING" },
          update: {
            status: "PENDING",
            reviewerId: null,
            reviewedAt: null,
          },
        }),
      ]
    : []),
  ]);

  revalidatePath("/upload");
  revalidatePath(`/upload/${wallpaperId}/edit`);
  revalidatePath("/browse");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/admin/moderation");
  return { success: true as const };
}

export async function setOwnWallpaperVisibility(input: unknown) {
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const, error: "UNAUTHORIZED" };
  }

  const parsed = wallpaperVisibilitySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR",
      issues: parsed.error.issues,
    };
  }

  const wallpaper = await prisma.wallpaper.findUnique({
    where: { id: parsed.data.wallpaperId },
    select: { id: true, uploaderId: true, isApproved: true },
  });
  if (!wallpaper) {
    return { success: false as const, error: "NOT_FOUND" };
  }
  if (wallpaper.uploaderId !== session.user.id) {
    return { success: false as const, error: "FORBIDDEN" };
  }
  if (!wallpaper.isApproved) {
    return { success: false as const, error: "NOT_APPROVED" };
  }

  await prisma.wallpaper.update({
    where: { id: wallpaper.id },
    data: { isPublic: parsed.data.isPublic },
  });

  revalidatePath("/upload");
  revalidatePath(`/upload/${wallpaper.id}/edit`);
  revalidatePath("/browse");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function deleteOwnWallpaper(input: unknown) {
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const, error: "UNAUTHORIZED" };
  }

  const parsed = deleteOwnWallpaperSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR",
      issues: parsed.error.issues,
    };
  }

  const wallpaper = await prisma.wallpaper.findUnique({
    where: { id: parsed.data.wallpaperId },
    select: {
      id: true,
      uploaderId: true,
      originalUrl: true,
      thumb400Url: true,
      thumb800Url: true,
      thumb1920Url: true,
    },
  });
  if (!wallpaper) {
    return { success: false as const, error: "NOT_FOUND" };
  }
  if (wallpaper.uploaderId !== session.user.id) {
    return { success: false as const, error: "FORBIDDEN" };
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

  revalidatePath("/upload");
  revalidatePath("/browse");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  return { success: true as const };
}
