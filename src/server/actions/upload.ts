"use server";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import { buildKey, sanitizeFileName } from "@/lib/fileStorage";
import { s3Client } from "@/lib/storage/b2Client";
import { generateThumbsAndUpload } from "@/lib/storage/imageProcessor";
import { generatePresignedUploadUrl } from "@/lib/storage/presignedUrl";
import { finalizeUploadSchema, initiateUploadSchema } from "@/lib/zodSchema";

const buildPublicUrl = (key: string): string => {
  const base = serverEnv.S3_PUBLIC_URL ?? serverEnv.S3_ENDPOINT;
  return `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
};

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

const deriveThumbKeys = (originalKey: string) => {
  const parts = originalKey.split("/");
  const fileName = parts[parts.length - 1] ?? "";
  const uuid =
    (
      fileName
        .slice(0, 36)
        .match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
    ) ?
      fileName.slice(0, 36)
    : (fileName.split("-")[0] ?? crypto.randomUUID());
  const base = parts.slice(0, -1).join("/");
  return {
    thumb400: `${base}/thumb-400-${uuid}.webp`,
    thumb800: `${base}/thumb-800-${uuid}.webp`,
    thumb1920: `${base}/thumb-1920-${uuid}.webp`,
  };
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
    tagIds,
    fileName,
    mimeType,
    fileSize,
  } = parsed.data;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.wallpaper.count({
    where: {
      uploaderId: session.user.id,
      createdAt: { gte: oneHourAgo },
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
  const slug = `${slugify(title)}-${crypto.randomUUID().slice(0, 8)}`;

  const wallpaper = await prisma.wallpaper.create({
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
  });

  const { url, key } = await generatePresignedUploadUrl(
    keys.original,
    mimeType,
  );

  void fileSize;

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
      return { success: false as const, error: "OBJECT_NOT_FOUND" };
    }
    const byteArray = await response.Body.transformToByteArray();
    objectBuffer = Buffer.from(byteArray);
  } catch {
    return { success: false as const, error: "OBJECT_NOT_FOUND" };
  }

  const thumbKeys = deriveThumbKeys(key);

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

  const updated = await prisma.wallpaper.update({
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
