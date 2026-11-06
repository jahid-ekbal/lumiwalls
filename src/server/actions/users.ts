"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { deleteManyFromS3 } from "@/lib/fileStorage";
import { isPrimaryAdminEmail } from "@/server/admin";
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
    select: { id: true, role: true, email: true },
  });
  if (!target) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  if (role === "user") {
    if (userId === authCheck.session.user.id) {
      return { success: false as const, error: "CANNOT_DEMOTE_SELF" as const };
    }
    if (isPrimaryAdminEmail(target.email)) {
      return { success: false as const, error: "PROTECTED_ADMIN" as const };
    }
  }

  if ((target.role ?? "user") === role) {
    return { success: true as const };
  }

  if (role === "user" && target.role === "admin") {
    const outcome = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "user" WHERE role = 'admin' FOR UPDATE`;
      const adminCount = await tx.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        return "LAST_ADMIN" as const;
      }
      await tx.user.update({ where: { id: userId }, data: { role } });
      // A demoted admin must not keep an active admin session.
      await tx.session.deleteMany({ where: { userId } });
      return "OK" as const;
    });
    if (outcome === "LAST_ADMIN") {
      return { success: false as const, error: "LAST_ADMIN" as const };
    }
  } else {
    await prisma.user.update({ where: { id: userId }, data: { role } });
  }

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
      email: true,
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
  if (isPrimaryAdminEmail(target.email)) {
    return { success: false as const, error: "PROTECTED_ADMIN" as const };
  }

  const keys = target.wallpapers
    .flatMap((wallpaper) => [
      extractS3Key(wallpaper.originalUrl),
      extractS3Key(wallpaper.thumb400Url),
      extractS3Key(wallpaper.thumb800Url),
      extractS3Key(wallpaper.thumb1920Url),
    ])
    .filter((key): key is string => Boolean(key));

  const outcome = await prisma.$transaction(async (tx) => {
    if (target.role === "admin") {
      await tx.$queryRaw`SELECT id FROM "user" WHERE role = 'admin' FOR UPDATE`;
      const adminCount = await tx.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        return "LAST_ADMIN" as const;
      }
    }
    await tx.user.delete({ where: { id: userId } });
    return "OK" as const;
  });

  if (outcome === "LAST_ADMIN") {
    return { success: false as const, error: "LAST_ADMIN" as const };
  }

  // The row is gone, so storage cleanup is best effort. A failure here must
  // not report the delete as failed or resurrect the user.
  if (keys.length > 0) {
    try {
      await deleteManyFromS3(keys);
    } catch (error) {
      console.error(
        "Failed to delete S3 files for deleted user",
        userId,
        error,
      );
    }
  }

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
