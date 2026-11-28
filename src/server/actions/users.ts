"use server";

import { hashPasswordFunction } from "@/lib/argon2";
import { requireAdminAction } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { deleteManyFromS3, extractS3Key } from "@/lib/fileStorage";
import { recordAdminAuditLog } from "@/lib/security/auditLog";
import {
  adminResetPasswordSchema,
  deleteUserSchema,
  setRoleSchema,
  wallpaperVisibilitySchema,
} from "@/lib/zodSchema";
import { isPrimaryAdminEmail } from "@/server/admin";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";

function generateTemporaryPassword(length = 20): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}

export async function setRole(input: unknown) {
  const authCheck = await requireAdminAction();
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
      await tx.session.deleteMany({ where: { userId } });
      return "OK" as const;
    });
    if (outcome === "LAST_ADMIN") {
      return { success: false as const, error: "LAST_ADMIN" as const };
    }
  } else {
    await prisma.user.update({ where: { id: userId }, data: { role } });
  }

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "USER_SET_ROLE",
    targetType: "user",
    targetId: userId,
    summary: `Changed role for ${target.email} from ${target.role ?? "user"} to ${role}`,
    metadata: { previousRole: target.role ?? "user", nextRole: role },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/audit");
  revalidatePath("/admin");
  return { success: true as const };
}

export async function adminResetUserPassword(input: unknown) {
  const authCheck = await requireAdminAction();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = adminResetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const { userId } = parsed.data;
  if (userId === authCheck.session.user.id) {
    return { success: false as const, error: "CANNOT_RESET_SELF" as const };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!target) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }
  if (isPrimaryAdminEmail(target.email)) {
    return { success: false as const, error: "PROTECTED_ADMIN" as const };
  }

  const tempPassword = generateTemporaryPassword(20);
  const hashedPassword = await hashPasswordFunction(tempPassword);

  await prisma.$transaction(async (tx) => {
    const credential = await tx.account.findFirst({
      where: { userId, providerId: "credential" },
      select: { id: true },
    });

    if (credential) {
      await tx.account.update({
        where: { id: credential.id },
        data: { password: hashedPassword, accountId: userId },
      });
    } else {
      await tx.account.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          accountId: userId,
          providerId: "credential",
          password: hashedPassword,
        },
      });
    }

    await tx.user.update({
      where: { id: userId },
      data: { mustChangePassword: true },
    });

    await tx.session.deleteMany({ where: { userId } });
  });

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "USER_PASSWORD_RESET",
    targetType: "user",
    targetId: userId,
    summary: `Issued temporary password reset and revoked active sessions for ${target.email}`,
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/audit");
  return { success: true as const, tempPassword };
}

export async function deleteUser(input: unknown) {
  const authCheck = await requireAdminAction();
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
      image: true,
      bannerUrl: true,
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

  const keys = [
    extractS3Key(target.image),
    extractS3Key(target.bannerUrl),
    ...target.wallpapers.flatMap((wallpaper) => [
      extractS3Key(wallpaper.originalUrl),
      extractS3Key(wallpaper.thumb400Url),
      extractS3Key(wallpaper.thumb800Url),
      extractS3Key(wallpaper.thumb1920Url),
    ]),
  ].filter((key): key is string => Boolean(key));

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

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "USER_DELETE",
    targetType: "user",
    targetId: userId,
    summary: `Deleted user ${target.email} and purged ${keys.length} stored media objects`,
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
  revalidatePath("/admin");
  revalidatePath("/browse");
  return { success: true as const };
}

export async function setWallpaperVisibility(input: unknown) {
  const authCheck = await requireAdminAction();
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
    select: { id: true, title: true, uploaderId: true },
  });
  if (!wallpaper) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  await prisma.wallpaper.update({
    where: { id: wallpaper.id },
    data: { isPublic: parsed.data.isPublic },
  });

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "WALLPAPER_VISIBILITY",
    targetType: "wallpaper",
    targetId: wallpaper.id,
    summary: `Set "${wallpaper.title}" visibility to ${parsed.data.isPublic ? "visible" : "hidden"}`,
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${wallpaper.uploaderId}`);
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/audit");
  revalidatePath("/browse");
  return { success: true as const };
}
