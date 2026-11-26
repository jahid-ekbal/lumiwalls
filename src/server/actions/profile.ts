"use server";

import { Prisma } from "@generated/prisma/client";
import { revalidatePath } from "next/cache";
import sharp from "sharp";

import { verifyPasswordFunction } from "@/lib/argon2";
import { getActiveSession, isBanActive } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import {
  deleteFromS3,
  deleteManyFromS3,
  extractS3Key,
  uploadWebpToS3,
} from "@/lib/fileStorage";
import { ensureHandle } from "@/lib/handle";
import { consumeRateLimit } from "@/lib/security/rateLimit";
import { detectImageFormat } from "@/lib/storage/fileValidation";
import { SAFE_SHARP_OPTIONS } from "@/lib/storage/imageProcessor";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_SIZE,
  clearProfileImageSchema,
  deleteOwnAccountSchema,
  followSchema,
  profileHandleSchema,
  profileUpdateSchema,
} from "@/lib/zodSchema";
import { isPrimaryAdminEmail } from "@/server/admin";

type ProfileActionError = string;

const clearEmpty = (value: string | undefined): string | null =>
  value && value.length > 0 ? value : null;

const extractProfileKey = (url: string | null): string | null => {
  if (!url) {
    return null;
  }
  const marker = "/api/images/";
  const index = url.indexOf(marker);
  if (index === -1) {
    return url.startsWith("avatars/") || url.startsWith("banners/") ?
        url
      : null;
  }
  return url.slice(index + marker.length);
};

const buildPublicUrl = (key: string): string => {
  const base = serverEnv.BETTER_AUTH_URL;
  return `${base.replace(/\/$/, "")}/api/images/${key.replace(/^\//, "")}`;
};

export async function updateProfile(input: unknown) {
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const, error: "You need to sign in first" };
  }

  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error:
        (parsed.error.issues[0]?.message as ProfileActionError | undefined) ??
        "Check the highlighted fields",
    };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      bio: clearEmpty(parsed.data.bio),
      location: clearEmpty(parsed.data.location),
    },
  });
  await ensureHandle(session.user.id);

  revalidatePath("/profile");
  revalidatePath("/settings");
  if (session.user.handle) {
    revalidatePath(`/u/${session.user.handle}`);
  }
  return { success: true as const };
}

export async function updateProfileHandle(input: unknown) {
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const, error: "You need to sign in first" };
  }

  const rateCheck = await consumeRateLimit({
    key: `handle:${session.user.id}`,
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateCheck.allowed) {
    return {
      success: false as const,
      error: "Handle updated too often. Please wait before trying again.",
    };
  }

  const parsed = profileHandleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error:
        parsed.error.issues[0]?.message ?? "Enter a valid lowercase handle",
    };
  }

  const nextHandle = parsed.data.handle;
  const existing = await prisma.user.findUnique({
    where: { handle: nextHandle },
    select: { id: true },
  });
  if (existing && existing.id !== session.user.id) {
    return {
      success: false as const,
      error: "That handle is already taken",
    };
  }

  const previousHandle = session.user.handle;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { handle: nextHandle },
  });

  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/browse");
  if (previousHandle) {
    revalidatePath(`/u/${previousHandle}`);
  }
  revalidatePath(`/u/${nextHandle}`);
  return { success: true as const, handle: nextHandle };
}

export async function updateProfileImage(formData: FormData) {
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const, error: "You need to sign in first" };
  }

  const rateCheck = await consumeRateLimit({
    key: `profile-media:${session.user.id}`,
    limit: 12,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateCheck.allowed) {
    return {
      success: false as const,
      error: "Too many media updates. Please try again later.",
    };
  }

  const kind = formData.get("kind");
  if (kind !== "avatar" && kind !== "banner") {
    return { success: false as const, error: "Unknown image kind" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false as const, error: "Pick an image to upload" };
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return {
      success: false as const,
      error: "Image is too large (max 50 MB)",
    };
  }
  if (
    !ALLOWED_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_MIME_TYPES)[number],
    )
  ) {
    return {
      success: false as const,
      error: "Only JPEG, PNG, WebP, or AVIF images are supported",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectImageFormat(buffer);
  if (!detected) {
    return {
      success: false as const,
      error: "Unsupported or corrupted image file",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, bannerUrl: true, handle: true },
  });
  const previous =
    kind === "avatar" ? (user?.image ?? null) : (user?.bannerUrl ?? null);
  const oldKey = extractProfileKey(previous);

  let uploadedKey: string | null = null;
  try {
    const metadata = await sharp(buffer, SAFE_SHARP_OPTIONS)
      .rotate()
      .metadata();
    if (!metadata.format || metadata.format !== detected) {
      return {
        success: false as const,
        error: "Unsupported or corrupted image file",
      };
    }

    const processed =
      kind === "avatar" ?
        await sharp(buffer, SAFE_SHARP_OPTIONS)
          .rotate()
          .resize(256, 256, { fit: "cover", position: "center" })
          .webp({ quality: 82 })
          .toBuffer()
      : await sharp(buffer, SAFE_SHARP_OPTIONS)
          .rotate()
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();

    const folder = kind === "avatar" ? "avatars" : "banners";
    uploadedKey = `${folder}/${session.user.id}/${crypto.randomUUID()}.webp`;
    await uploadWebpToS3(uploadedKey, processed);
    const publicUrl = buildPublicUrl(uploadedKey);

    await prisma.user.update({
      where: { id: session.user.id },
      data: kind === "avatar" ? { image: publicUrl } : { bannerUrl: publicUrl },
    });

    if (oldKey) {
      await deleteFromS3(oldKey);
    }

    revalidatePath("/profile");
    revalidatePath("/browse");
    if (user?.handle) {
      revalidatePath(`/u/${user.handle}`);
    }
    return { success: true as const, url: publicUrl };
  } catch {
    if (uploadedKey) {
      await deleteFromS3(uploadedKey);
    }
    return {
      success: false as const,
      error: "That file could not be processed as an image",
    };
  }
}

export async function removeProfileImage(input: unknown) {
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const, error: "You need to sign in first" };
  }

  const parsed = clearProfileImageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid image target" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, bannerUrl: true, handle: true },
  });
  const previous =
    parsed.data.kind === "avatar" ?
      (user?.image ?? null)
    : (user?.bannerUrl ?? null);
  const oldKey = extractProfileKey(previous);

  await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data.kind === "avatar" ? { image: null } : { bannerUrl: null },
  });

  if (oldKey) {
    await deleteFromS3(oldKey);
  }

  revalidatePath("/profile");
  revalidatePath("/browse");
  if (user?.handle) {
    revalidatePath(`/u/${user.handle}`);
  }
  return { success: true as const };
}

export async function completePasswordRotation() {
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { mustChangePassword: false },
  });

  revalidatePath("/profile");
  revalidatePath("/browse");
  return { success: true as const };
}

export async function deleteOwnAccount(input: unknown) {
  const session = await getActiveSession();
  if (!session?.user) {
    return { success: false as const, error: "You need to sign in first" };
  }

  const parsed = deleteOwnAccountSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Check your confirmation input",
    };
  }

  const target = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      image: true,
      bannerUrl: true,
      accounts: {
        where: { providerId: "credential" },
        select: { password: true },
      },
      wallpapers: {
        select: {
          originalUrl: true,
          thumb400Url: true,
          thumb800Url: true,
          thumb1920Url: true,
        },
      },
    },
  });

  if (!target) {
    return { success: false as const, error: "Account not found" };
  }
  if (isPrimaryAdminEmail(target.email)) {
    return {
      success: false as const,
      error: "The primary admin account cannot be self-deleted",
    };
  }

  const credentialPassword = target.accounts[0]?.password;
  if (!credentialPassword) {
    return {
      success: false as const,
      error: "No password credential configured on this account",
    };
  }

  const validPassword = await verifyPasswordFunction({
    hash: credentialPassword,
    password: parsed.data.password,
  });
  if (!validPassword) {
    return { success: false as const, error: "Incorrect password" };
  }

  const outcome = await prisma.$transaction(async (tx) => {
    if (target.role === "admin") {
      await tx.$queryRaw`SELECT id FROM "user" WHERE role = 'admin' FOR UPDATE`;
      const adminCount = await tx.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        return "LAST_ADMIN" as const;
      }
    }
    await tx.user.delete({ where: { id: target.id } });
    return "OK" as const;
  });

  if (outcome === "LAST_ADMIN") {
    return {
      success: false as const,
      error: "Cannot delete the last remaining admin account",
    };
  }

  const s3Keys = [
    extractS3Key(target.image),
    extractS3Key(target.bannerUrl),
    ...target.wallpapers.flatMap((wallpaper) => [
      extractS3Key(wallpaper.originalUrl),
      extractS3Key(wallpaper.thumb400Url),
      extractS3Key(wallpaper.thumb800Url),
      extractS3Key(wallpaper.thumb1920Url),
    ]),
  ].filter((key): key is string => Boolean(key));

  if (s3Keys.length > 0) {
    await deleteManyFromS3(s3Keys);
  }

  return { success: true as const };
}

export async function toggleFollow(input: unknown) {
  const session = await getActiveSession();
  if (!session?.user) {
    return {
      success: false as const,
      error: "Sign in to follow creators",
    };
  }

  const parsed = followSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "That profile could not be found",
    };
  }

  const target = await prisma.user.findUnique({
    where: { handle: parsed.data.handle },
    select: { id: true, banned: true, banExpires: true },
  });
  if (!target || isBanActive(target)) {
    return {
      success: false as const,
      error: "That profile could not be found",
    };
  }
  if (target.id === session.user.id) {
    return {
      success: false as const,
      error: "You cannot follow your own profile",
    };
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: target.id,
      },
    },
    select: { followerId: true },
  });

  let following = false;
  if (existing) {
    try {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: target.id,
          },
        },
      });
      following = false;
    } catch (error) {
      if (
        !(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2025"
        )
      ) {
        throw error;
      }
      following = false;
    }
  } else {
    try {
      await prisma.follow.create({
        data: { followerId: session.user.id, followingId: target.id },
      });
      following = true;
    } catch (error) {
      if (
        !(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        )
      ) {
        throw error;
      }
      following = true;
    }
  }

  revalidatePath("/browse");
  revalidatePath("/profile");
  revalidatePath(`/u/${parsed.data.handle}`);
  return { success: true as const, following };
}
