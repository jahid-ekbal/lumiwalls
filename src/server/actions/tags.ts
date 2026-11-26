"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@generated/prisma/client";
import { requireAdminAction } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { recordAdminAuditLog } from "@/lib/security/auditLog";
import { slugify } from "@/lib/slugify";
import { tagCreateSchema, tagUpdateSchema } from "@/lib/zodSchema";

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

export async function createTag(input: unknown) {
  const authCheck = await requireAdminAction();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = tagCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const rawName = parsed.data.name.trim();
  const normalizedName = rawName.toLowerCase();
  let slug =
    parsed.data.slug?.trim() ?
      parsed.data.slug.trim()
    : slugify(normalizedName);
  if (!slug) slug = slugify(normalizedName);

  const existingName = await prisma.tag.findUnique({
    where: { name: normalizedName },
  });
  if (existingName) {
    return { success: false as const, error: "NAME_EXISTS" as const };
  }
  const existingSlug = await prisma.tag.findUnique({ where: { slug } });
  if (existingSlug) {
    return { success: false as const, error: "SLUG_EXISTS" as const };
  }

  const description = parsed.data.description?.trim() || null;
  const color = parsed.data.color?.trim() || null;

  try {
    const tag = await prisma.tag.create({
      data: { name: normalizedName, slug, description, color },
    });

    await recordAdminAuditLog({
      actorId: authCheck.session.user.id,
      action: "TAG_CREATE",
      targetType: "tag",
      targetId: tag.id,
      summary: `Created tag #${tag.name}`,
    });

    revalidatePath("/admin/tags");
    revalidatePath("/admin/audit");
    revalidatePath("/upload");
    revalidatePath("/browse");
    return { success: true as const, data: tag };
  } catch (error) {
    return mapUniqueViolation(error);
  }
}

export async function updateTag(input: unknown) {
  const authCheck = await requireAdminAction();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = tagUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const { id } = parsed.data;
  const rawName = parsed.data.name.trim();
  const normalizedName = rawName.toLowerCase();

  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  const submittedSlug = parsed.data.slug?.trim() ? parsed.data.slug.trim() : "";
  const slug =
    !submittedSlug || submittedSlug === slugify(existing.name) ?
      slugify(normalizedName)
    : submittedSlug;

  const nameConflict = await prisma.tag.findFirst({
    where: { name: normalizedName, id: { not: id } },
  });
  if (nameConflict) {
    return { success: false as const, error: "NAME_EXISTS" as const };
  }
  const slugConflict = await prisma.tag.findFirst({
    where: { slug, id: { not: id } },
  });
  if (slugConflict) {
    return { success: false as const, error: "SLUG_EXISTS" as const };
  }

  const description = parsed.data.description?.trim() || null;
  const color = parsed.data.color?.trim() || null;

  try {
    const updated = await prisma.tag.update({
      where: { id },
      data: { name: normalizedName, slug, description, color },
    });

    await recordAdminAuditLog({
      actorId: authCheck.session.user.id,
      action: "TAG_UPDATE",
      targetType: "tag",
      targetId: updated.id,
      summary: `Updated tag #${updated.name}`,
    });

    revalidatePath("/admin/tags");
    revalidatePath("/admin/audit");
    revalidatePath("/upload");
    revalidatePath("/browse");
    return { success: true as const, data: updated };
  } catch (error) {
    return mapUniqueViolation(error);
  }
}

export async function deleteTag(input: unknown) {
  const authCheck = await requireAdminAction();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const id = typeof input === "string" ? input : (input as { id?: string })?.id;
  if (!id || typeof id !== "string") {
    return { success: false as const, error: "VALIDATION_ERROR" as const };
  }

  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  await prisma.tag.delete({ where: { id } });

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "TAG_DELETE",
    targetType: "tag",
    targetId: existing.id,
    summary: `Deleted tag #${existing.name}`,
  });

  revalidatePath("/admin/tags");
  revalidatePath("/admin/audit");
  revalidatePath("/upload");
  revalidatePath("/browse");
  return { success: true as const };
}
