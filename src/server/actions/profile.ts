"use server";

import sharp from "sharp";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import { deleteFromS3, uploadWebpToS3 } from "@/lib/fileStorage";
import { ensureHandle } from "@/lib/handle";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_SIZE,
  followSchema,
  profileUpdateSchema,
} from "@/lib/zodSchema";

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

/**
 * Update the signed-in user's name, bio, and location, and make sure the
 * lazy handle exists afterwards.
 */
export async function updateProfile(input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
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
  return { success: true as const };
}

/**
 * Upload a new avatar or banner through the shared webp pipeline.
 *
 * Avatars become 256x256 cover crops, banners are fit to at most
 * 1920px wide keeping their aspect ratio. The previous image object is
 * deleted from storage after the database row is updated.
 */
export async function updateProfileImage(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false as const, error: "You need to sign in first" };
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, bannerUrl: true },
  });
  const previous =
    kind === "avatar" ? (user?.image ?? null) : (user?.bannerUrl ?? null);
  const oldKey = extractProfileKey(previous);

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const processed =
      kind === "avatar" ?
        await sharp(buffer)
          .resize(256, 256, { fit: "cover", position: "center" })
          .webp({ quality: 82 })
          .toBuffer()
      : await sharp(buffer)
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();

    const folder = kind === "avatar" ? "avatars" : "banners";
    const key = `${folder}/${session.user.id}/${crypto.randomUUID()}.webp`;
    await uploadWebpToS3(key, processed);
    const publicUrl = buildPublicUrl(key);

    await prisma.user.update({
      where: { id: session.user.id },
      data: kind === "avatar" ? { image: publicUrl } : { bannerUrl: publicUrl },
    });

    if (oldKey) {
      await deleteFromS3(oldKey);
    }

    revalidatePath("/profile");
    return { success: true as const, url: publicUrl };
  } catch {
    return {
      success: false as const,
      error: "That file could not be processed as an image",
    };
  }
}

/**
 * Toggle following for the signed-in viewer on a target handle.
 * Self-follow is rejected; nothing is created or deleted when the
 * target profile does not exist.
 */
export async function toggleFollow(input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
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
    select: { id: true },
  });
  if (!target) {
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

  if (existing) {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: target.id,
        },
      },
    });
    return { success: true as const, following: false as const };
  }

  await prisma.follow.create({
    data: { followerId: session.user.id, followingId: target.id },
  });
  return { success: true as const, following: true as const };
}
