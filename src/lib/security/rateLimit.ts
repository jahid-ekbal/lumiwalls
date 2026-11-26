import prisma from "@/lib/database/dbClient";
import { headers } from "next/headers";

export async function getRequestIp(): Promise<string | null> {
  try {
    const hdrs = await headers();
    const forwarded = hdrs.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) {
        return first.slice(0, 64);
      }
    }
    const realIp = hdrs.get("x-real-ip")?.trim();
    return realIp ? realIp.slice(0, 64) : null;
  } catch {
    return null;
  }
}

export async function consumeRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  const nextReset = new Date(now.getTime() + windowMs);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimit.findUnique({
      where: { key },
      select: { count: true, resetAt: true },
    });

    if (!existing || existing.resetAt <= now) {
      const upserted = await tx.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt: nextReset },
        update: { count: 1, resetAt: nextReset },
        select: { count: true, resetAt: true },
      });
      return {
        allowed: true,
        remaining: Math.max(0, limit - upserted.count),
        resetAt: upserted.resetAt,
      };
    }

    if (existing.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: existing.resetAt,
      };
    }

    const updated = await tx.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
      select: { count: true, resetAt: true },
    });

    return {
      allowed: true,
      remaining: Math.max(0, limit - updated.count),
      resetAt: updated.resetAt,
    };
  });

  // Opportunistic expired-row cleanup so the rate_limit table stays compact.
  if (Math.random() < 0.03) {
    prisma.rateLimit
      .deleteMany({ where: { resetAt: { lt: now } } })
      .catch(() => {});
  }

  return result;
}
