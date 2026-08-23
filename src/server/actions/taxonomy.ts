"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  tagCreateSchema,
  tagUpdateSchema,
} from "@/lib/zodSchema";

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

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

export async function createCategory(input: unknown) {
  const authCheck = await requireAdmin();
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

  const { name, description, icon, color } = parsed.data;
  let slug = parsed.data.slug?.trim() ? parsed.data.slug.trim() : slugify(name);
  if (!slug) slug = slugify(name);

  const existingName = await prisma.category.findUnique({ where: { name } });
  if (existingName) {
    return { success: false as const, error: "NAME_EXISTS" as const };
  }
  const existingSlug = await prisma.category.findUnique({ where: { slug } });
  if (existingSlug) {
    return { success: false as const, error: "SLUG_EXISTS" as const };
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      description: description?.trim() ? description.trim() : null,
      icon: icon?.trim() ? icon.trim() : null,
      color: color?.trim() ? color.trim() : null,
    },
  });

  revalidatePath("/admin/taxonomy");
  revalidatePath("/upload");
  return { success: true as const, data: category };
}

export async function updateCategory(input: unknown) {
  const authCheck = await requireAdmin();
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

  const { id, name, description, icon, color } = parsed.data;
  let slug = parsed.data.slug?.trim() ? parsed.data.slug.trim() : slugify(name);
  if (!slug) slug = slugify(name);

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return { success: false as const, error: "NOT_FOUND" as const };
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

  const updated = await prisma.category.update({
    where: { id },
    data: {
      name,
      slug,
      description: description?.trim() ? description.trim() : null,
      icon: icon?.trim() ? icon.trim() : null,
      color: color?.trim() ? color.trim() : null,
    },
  });

  revalidatePath("/admin/taxonomy");
  revalidatePath("/upload");
  return { success: true as const, data: updated };
}

export async function deleteCategory(input: unknown) {
  const authCheck = await requireAdmin();
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

  revalidatePath("/admin/taxonomy");
  revalidatePath("/upload");
  return { success: true as const };
}

export async function createTag(input: unknown) {
  const authCheck = await requireAdmin();
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

  const tag = await prisma.tag.create({
    data: { name: normalizedName, slug },
  });

  revalidatePath("/admin/taxonomy");
  revalidatePath("/upload");
  return { success: true as const, data: tag };
}

export async function updateTag(input: unknown) {
  const authCheck = await requireAdmin();
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
  let slug =
    parsed.data.slug?.trim() ?
      parsed.data.slug.trim()
    : slugify(normalizedName);
  if (!slug) slug = slugify(normalizedName);

  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

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

  const updated = await prisma.tag.update({
    where: { id },
    data: { name: normalizedName, slug },
  });

  revalidatePath("/admin/taxonomy");
  revalidatePath("/upload");
  return { success: true as const, data: updated };
}

export async function deleteTag(input: unknown) {
  const authCheck = await requireAdmin();
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

  revalidatePath("/admin/taxonomy");
  revalidatePath("/upload");
  return { success: true as const };
}
