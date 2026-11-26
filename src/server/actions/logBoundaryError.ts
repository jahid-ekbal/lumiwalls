"use server";

import { getActiveSession } from "@/lib/auth/session";
import { consumeRateLimit, getRequestIp } from "@/lib/security/rateLimit";
import z from "zod";

const boundaryErrorSchema = z.object({
  route: z.string().trim().min(1).max(200),
  digest: z.string().trim().max(100).optional(),
  message: z.string().trim().min(1).max(500),
  stack: z.string().trim().max(1500).optional(),
});

export async function logBoundaryError(input: unknown): Promise<void> {
  const parsed = boundaryErrorSchema.safeParse(input);
  if (!parsed.success) {
    return;
  }

  const session = await getActiveSession();
  const ip = await getRequestIp();
  const rateKey = session ? `boundary:user:${session.user.id}` : `boundary:ip:${ip ?? "unknown"}`;

  const limitCheck = await consumeRateLimit({
    key: rateKey,
    limit: 20,
    windowMs: 60_000,
  });
  if (!limitCheck.allowed) {
    return;
  }

  console.error(
    JSON.stringify({
      scope: "route-boundary",
      userId: session?.user.id ?? null,
      route: parsed.data.route,
      digest: parsed.data.digest ?? "none",
      message: parsed.data.message,
      ...(session ? { stack: parsed.data.stack ?? "none" } : {}),
    }),
  );
}
