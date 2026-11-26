import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const isBanActive = (user: {
  banned?: boolean | null;
  banExpires?: Date | null;
}): boolean => {
  if (user.banned !== true) {
    return false;
  }
  if (!user.banExpires) {
    return true;
  }
  return user.banExpires.getTime() > Date.now();
};

export const getActiveSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      banExpires: true,
      mustChangePassword: true,
      handle: true,
      image: true,
      bannerUrl: true,
    },
  });

  if (!dbUser || isBanActive(dbUser)) {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role ?? "user",
      handle: dbUser.handle,
      image: dbUser.image,
      bannerUrl: dbUser.bannerUrl,
      mustChangePassword: dbUser.mustChangePassword,
      banned: false,
    },
  };
});

export type ActiveSession = NonNullable<
  Awaited<ReturnType<typeof getActiveSession>>
>;

export const requireActiveUser = async (): Promise<ActiveSession> => {
  const session = await getActiveSession();
  if (!session) {
    redirect("/");
  }
  return session;
};

export const requireAdminUser = async (): Promise<ActiveSession> => {
  const session = await requireActiveUser();
  if (session.user.role !== "admin") {
    redirect("/browse");
  }
  return session;
};

export const requireAdminAction = async () => {
  const session = await getActiveSession();
  if (!session) {
    return { authorized: false as const, error: "UNAUTHORIZED" as const };
  }
  if (session.user.role !== "admin") {
    return { authorized: false as const, error: "FORBIDDEN" as const };
  }
  return { authorized: true as const, session };
};
