"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { deleteManyFromS3 } from "@/lib/fileStorage";
import {
  deleteUserSchema,
  setRoleSchema,
  wallpaperVisibilitySchema,
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

function extractS3Key(url: string | null): string | null {
  if (!url) {
    return null;
  }
  const marker = "/api/images/";
  const index = url.indexOf(marker);
  if (index === -1) {
    return url.startsWith("wallpapers/") ? url : null;
  }
  return url.slice(index + marker.length);
}

export async function setRole(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = setRoleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const { userId, role } = parsed.data;
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  if (role === "user" && userId === authCheck.session.user.id) {
    return { success: false as const, error: "CANNOT_DEMOTE_SELF" as const };
  }

  if (role === "user" && target.role === "admin") {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      return { success: false as const, error: "LAST_ADMIN" as const };
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin");
  return { success: true as const };
}

export async function deleteUser(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = deleteUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const { userId } = parsed.data;
  if (userId === authCheck.session.user.id) {
    return { success: false as const, error: "CANNOT_DELETE_SELF" as const };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
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
    return { success: false as const, error: "NOT_FOUND" as const };
  }
  if (target.role === "admin") {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      return { success: false as const, error: "LAST_ADMIN" as const };
    }
  }

  const keys = target.wallpapers
    .flatMap((wallpaper) => [
      extractS3Key(wallpaper.originalUrl),
      extractS3Key(wallpaper.thumb400Url),
      extractS3Key(wallpaper.thumb800Url),
      extractS3Key(wallpaper.thumb1920Url),
    ])
    .filter((key): key is string => Boolean(key));

  if (keys.length > 0) {
    await deleteManyFromS3(keys);
  }
  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/browse");
  return { success: true as const };
}

export async function setWallpaperVisibility(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = wallpaperVisibilitySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const wallpaper = await prisma.wallpaper.findUnique({
    where: { id: parsed.data.wallpaperId },
    select: { id: true, uploaderId: true },
  });
  if (!wallpaper) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  await prisma.wallpaper.update({
    where: { id: wallpaper.id },
    data: { isPublic: parsed.data.isPublic },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${wallpaper.uploaderId}`);
  revalidatePath("/admin/moderation");
  revalidatePath("/browse");
  return { success: true as const };
}
