"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { recordAdminAuditLog } from "@/lib/security/auditLog";
import { placementSchema, placementUpdateSchema } from "@/lib/zodSchema";

const flagForPlacement = (placement: string): "featured" | "editorsPick" =>
  placement === "TRENDING" ? "editorsPick" : "featured";

const placementsOfKind = (kind: "featured" | "editorsPick"): string[] =>
  kind === "featured" ? ["HERO", "SEASONAL"] : ["TRENDING"];

function revalidateFeatured() {
  revalidatePath("/admin/featured");
  revalidatePath("/admin/collections");
  revalidatePath("/admin/audit");
  revalidatePath("/browse");
}

function isPlacementCurrentlyLive(
  active: boolean,
  startAt: Date,
  endAt: Date | null,
): boolean {
  if (!active) return false;
  const now = Date.now();
  return startAt.getTime() <= now && (!endAt || endAt.getTime() >= now);
}

export async function createPlacement(input: unknown) {
  const authCheck = await requireAdminAction();
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
      select: { id: true, title: true, isApproved: true, isPublic: true },
    })) ??
    (await prisma.wallpaper.findUnique({
      where: { slug: parsed.data.wallpaperId },
      select: { id: true, title: true, isApproved: true, isPublic: true },
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

  if (
    isPlacementCurrentlyLive(
      parsed.data.active ?? true,
      parsed.data.startAt,
      parsed.data.endAt ?? null,
    )
  ) {
    await prisma.wallpaper.update({
      where: { id: eligible.id },
      data: { [flagForPlacement(parsed.data.placement)]: true },
    });
  }

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "PLACEMENT_CREATE",
    targetType: "placement",
    targetId: placement.id,
    summary: `Scheduled ${parsed.data.placement} placement for "${eligible.title}"`,
  });

  revalidateFeatured();
  return { success: true as const, data: { id: placement.id } };
}

export async function updatePlacement(input: unknown) {
  const authCheck = await requireAdminAction();
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
      select: { id: true, title: true, isApproved: true, isPublic: true },
    })) ??
    (await prisma.wallpaper.findUnique({
      where: { slug: parsed.data.wallpaperId },
      select: { id: true, title: true, isApproved: true, isPublic: true },
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

  if (
    isPlacementCurrentlyLive(
      parsed.data.active ?? true,
      parsed.data.startAt,
      parsed.data.endAt ?? null,
    )
  ) {
    await prisma.wallpaper.update({
      where: { id: eligible.id },
      data: { [flagForPlacement(parsed.data.placement)]: true },
    });
  }

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "PLACEMENT_UPDATE",
    targetType: "placement",
    targetId: parsed.data.id,
    summary: `Updated ${parsed.data.placement} placement for "${eligible.title}"`,
  });

  revalidateFeatured();
  return { success: true as const };
}

export async function expirePlacement(input: unknown) {
  const authCheck = await requireAdminAction();
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

  const now = new Date();
  const kind = flagForPlacement(existing.placement);
  const remaining = await prisma.featuredPlacement.count({
    where: {
      wallpaperId: existing.wallpaperId,
      active: true,
      startAt: { lte: now },
      placement: {
        in: placementsOfKind(kind) as ("HERO" | "TRENDING" | "SEASONAL")[],
      },
      OR: [{ endAt: null }, { endAt: { gte: now } }],
    },
  });
  if (remaining === 0) {
    await prisma.wallpaper.update({
      where: { id: existing.wallpaperId },
      data: { [kind]: false },
    });
  }

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "PLACEMENT_EXPIRE",
    targetType: "placement",
    targetId: existing.id,
    summary: `Expired ${existing.placement} placement ${existing.id}`,
  });

  revalidateFeatured();
  return { success: true as const };
}

export async function deletePlacement(input: unknown) {
  const authCheck = await requireAdminAction();
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

  const now = new Date();
  const kind = flagForPlacement(existing.placement);
  const remaining = await prisma.featuredPlacement.count({
    where: {
      wallpaperId: existing.wallpaperId,
      active: true,
      startAt: { lte: now },
      placement: {
        in: placementsOfKind(kind) as ("HERO" | "TRENDING" | "SEASONAL")[],
      },
      OR: [{ endAt: null }, { endAt: { gte: now } }],
    },
  });
  if (remaining === 0) {
    await prisma.wallpaper.update({
      where: { id: existing.wallpaperId },
      data: { [kind]: false },
    });
  }

  await recordAdminAuditLog({
    actorId: authCheck.session.user.id,
    action: "PLACEMENT_DELETE",
    targetType: "placement",
    targetId: existing.id,
    summary: `Deleted ${existing.placement} placement ${existing.id}`,
  });

  revalidateFeatured();
  return { success: true as const };
}
