"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { placementSchema, placementUpdateSchema } from "@/lib/zodSchema";

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

const flagForPlacement = (placement: string): "featured" | "editorsPick" =>
  placement === "TRENDING" ? "editorsPick" : "featured";

const placementsOfKind = (kind: "featured" | "editorsPick"): string[] =>
  kind === "featured" ? ["HERO", "SEASONAL"] : ["TRENDING"];

function revalidateFeatured(id?: string) {
  revalidatePath("/admin/featured");
  if (id) {
    revalidatePath(`/admin/featured/${id}`);
  }
  revalidatePath("/admin/collections");
  revalidatePath("/browse");
}

export async function createPlacement(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = placementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  if (parsed.data.endAt && parsed.data.endAt <= parsed.data.startAt) {
    return { success: false as const, error: "INVALID_RANGE" as const };
  }
  const eligible =
    (await prisma.wallpaper.findUnique({
      where: { id: parsed.data.wallpaperId },
      select: { id: true, isApproved: true, isPublic: true },
    })) ??
    (await prisma.wallpaper.findUnique({
      where: { slug: parsed.data.wallpaperId },
      select: { id: true, isApproved: true, isPublic: true },
    }));
  if (!eligible || !eligible.isApproved || !eligible.isPublic) {
    return { success: false as const, error: "NOT_AVAILABLE" as const };
  }

  const placement = await prisma.featuredPlacement.create({
    data: {
      wallpaperId: eligible.id,
      placement: parsed.data.placement,
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt ?? null,
      priority: parsed.data.priority ?? 0,
      active: parsed.data.active ?? true,
      curatorId: authCheck.session.user.id,
    },
    select: { id: true },
  });

  await prisma.wallpaper.update({
    where: { id: eligible.id },
    data: { [flagForPlacement(parsed.data.placement)]: true },
  });

  revalidateFeatured(placement.id);
  return { success: true as const, data: { id: placement.id } };
}

export async function updatePlacement(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = placementUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  if (parsed.data.endAt && parsed.data.endAt <= parsed.data.startAt) {
    return { success: false as const, error: "INVALID_RANGE" as const };
  }
  const eligible =
    (await prisma.wallpaper.findUnique({
      where: { id: parsed.data.wallpaperId },
      select: { id: true, isApproved: true, isPublic: true },
    })) ??
    (await prisma.wallpaper.findUnique({
      where: { slug: parsed.data.wallpaperId },
      select: { id: true, isApproved: true, isPublic: true },
    }));
  if (!eligible || !eligible.isApproved || !eligible.isPublic) {
    return { success: false as const, error: "NOT_AVAILABLE" as const };
  }

  const existing = await prisma.featuredPlacement.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!existing) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  await prisma.featuredPlacement.update({
    where: { id: parsed.data.id },
    data: {
      wallpaperId: eligible.id,
      placement: parsed.data.placement,
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt ?? null,
      priority: parsed.data.priority ?? 0,
      active: parsed.data.active ?? true,
    },
  });

  await prisma.wallpaper.update({
    where: { id: eligible.id },
    data: { [flagForPlacement(parsed.data.placement)]: true },
  });

  revalidateFeatured(parsed.data.id);
  return { success: true as const };
}

export async function expirePlacement(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = placementUpdateSchema.pick({ id: true }).safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const existing = await prisma.featuredPlacement.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, wallpaperId: true, placement: true },
  });
  if (!existing) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  await prisma.featuredPlacement.update({
    where: { id: existing.id },
    data: { endAt: new Date(), active: false },
  });

  const kind = flagForPlacement(existing.placement);
  const remaining = await prisma.featuredPlacement.count({
    where: {
      wallpaperId: existing.wallpaperId,
      active: true,
      placement: {
        in: placementsOfKind(kind) as ("HERO" | "TRENDING" | "SEASONAL")[],
      },
      OR: [{ endAt: null }, { endAt: { gte: new Date() } }],
    },
  });
  if (remaining === 0) {
    await prisma.wallpaper.update({
      where: { id: existing.wallpaperId },
      data: { [kind]: false },
    });
  }

  revalidateFeatured(existing.id);
  return { success: true as const };
}

export async function deletePlacement(input: unknown) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = placementUpdateSchema.pick({ id: true }).safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "VALIDATION_ERROR" as const,
      issues: parsed.error.issues,
    };
  }

  const existing = await prisma.featuredPlacement.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, wallpaperId: true, placement: true },
  });
  if (!existing) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  await prisma.featuredPlacement.delete({ where: { id: existing.id } });

  const kind = flagForPlacement(existing.placement);
  const remaining = await prisma.featuredPlacement.count({
    where: {
      wallpaperId: existing.wallpaperId,
      active: true,
      placement: {
        in: placementsOfKind(kind) as ("HERO" | "TRENDING" | "SEASONAL")[],
      },
      OR: [{ endAt: null }, { endAt: { gte: new Date() } }],
    },
  });
  if (remaining === 0) {
    await prisma.wallpaper.update({
      where: { id: existing.wallpaperId },
      data: { [kind]: false },
    });
  }

  revalidateFeatured();
  return { success: true as const };
}
