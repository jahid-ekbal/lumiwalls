"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@generated/prisma/client";
import { requireAdminAction } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { recordAdminAuditLog } from "@/lib/security/auditLog";
import { slugify } from "@/lib/slugify";
import { categoryCreateSchema, categoryUpdateSchema } from "@/lib/zodSchema";

let cachedIconNames: Set<string> | null = null;

async function getValidIconNames(): Promise<Set<string>> {
  if (!cachedIconNames) {
    const { icons } = await import("lucide-react");
    cachedIconNames = new Set(Object.keys(icons));
  }
  return cachedIconNames;
}

function mapUniqueViolation(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = (error.meta?.target as string[] | undefined) ?? [];
    if (target.includes("slug")) {
      return { success: false as const, error: "SLUG_EXISTS" as const };
    }
    if (target.includes("name")) {
      return { success: false as const, error: "NAME_EXISTS" as const };
    }
  }
  throw error;
}

async function validateIcon(icon: string | undefined | null) {
  const trimmed = icon?.trim() ? icon.trim() : null;
  if (!trimmed) return { valid: true as const, icon: null };
  const validNames = await getValidIconNames();
  if (!validNames.has(trimmed)) {
    return { valid: false as const, error: "INVALID_ICON" as const };
  }
  return { valid: true as const, icon: trimmed };
}

export async function createCategory(input: unknown) {
  const authCheck = await requireAdminAction();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = categoryCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const { name, color } = parsed.data;
  let slug = parsed.data.slug?.trim() ? parsed.data.slug.trim() : slugify(name);
  if (!slug) slug = slugify(name);

  const iconCheck = await validateIcon(parsed.data.icon);
  if (!iconCheck.valid) {
    return { success: false as const, error: iconCheck.error };
  }

  const existingName = await prisma.category.findUnique({ where: { name } });
  if (existingName) {
    return { success: false as const, error: "NAME_EXISTS" as const };
  }
  const existingSlug = await prisma.category.findUnique({ where: { slug } });
  if (existingSlug) {
    return { success: false as const, error: "SLUG_EXISTS" as const };
  }

  try {
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        icon: iconCheck.icon,
        color: color?.trim() ? color.trim() : null,
      },
    });

    await recordAdminAuditLog({
      actorId: authCheck.session.user.id,
      action: "CATEGORY_CREATE",
      targetType: "category",
      targetId: category.id,
      summary: `Created category "${category.name}"`,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/admin/audit");
    revalidatePath("/upload");
    revalidatePath("/upload/new");
    revalidatePath("/browse");
    return { success: true as const, data: category };
  } catch (error) {
    return mapUniqueViolation(error);
  }
}

export async function updateCategory(input: unknown) {
  const authCheck = await requireAdminAction();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = categoryUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const { id, name, color } = parsed.data;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  const submittedSlug = parsed.data.slug?.trim() ? parsed.data.slug.trim() : "";
  const slug =
    !submittedSlug || submittedSlug === slugify(existing.name) ?
      slugify(name)
    : submittedSlug;

  const iconCheck = await validateIcon(parsed.data.icon);
  if (!iconCheck.valid) {
    return { success: false as const, error: iconCheck.error };
  }

  const nameConflict = await prisma.category.findFirst({
    where: { name, id: { not: id } },
  });
  if (nameConflict) {
    return { success: false as const, error: "NAME_EXISTS" as const };
  }
  const slugConflict = await prisma.category.findFirst({
    where: { slug, id: { not: id } },
  });
  if (slugConflict) {
    return { success: false as const, error: "SLUG_EXISTS" as const };
  }

  try {
    const updated = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        icon: iconCheck.icon,
        color: color?.trim() ? color.trim() : null,
      },
    });

    await recordAdminAuditLog({
      actorId: authCheck.session.user.id,
      action: "CATEGORY_UPDATE",
      targetType: "category",
      targetId: updated.id,
      summary: `Updated category "${updated.name}"`,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/admin/audit");
    revalidatePath("/upload");
    revalidatePath("/upload/new");
    revalidatePath("/browse");
    return { success: true as const, data: updated };
  } catch (error) {
    return mapUniqueViolation(error);
  }
}

export async function deleteCategory(input: unknown) {
  const authCheck = await requireAdminAction();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const id = typeof input === "string" ? input : (input as { id?: string })?.id;
  if (!id || typeof id !== "string") {
    return { success: false as const, error: "VALIDATION_ERROR" as const };
  }

  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { wallpapers: true } } },
  });
  if (!existing) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  await prisma.category.delete({ where: { id } });

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "CATEGORY_DELETE",
    targetType: "category",
    targetId: existing.id,
    summary: `Deleted category "${existing.name}"`,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/audit");
  revalidatePath("/upload");
  revalidatePath("/browse");
  return { success: true as const };
}
