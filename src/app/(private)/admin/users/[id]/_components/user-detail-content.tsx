import UserDetailClient from "@/components/Admin/UserDetailClient";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { isPrimaryAdminEmail } from "@/server/admin";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

type Props = {
  userId: string;
};

const UserDetailContent = async ({ userId }: Props) => {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      banned: true,
      banReason: true,
      banExpires: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { wallpapers: true } },
    },
  });
  if (!user) {
    notFound();
  }

  const [pendingCount, reportsMade, reportsAgainst, recentWallpapers] =
    await Promise.all([
      prisma.moderationQueue.count({
        where: { status: "PENDING", wallpaper: { uploaderId: userId } },
      }),
      prisma.report.count({ where: { reporterId: userId } }),
      prisma.report.count({ where: { wallpaper: { uploaderId: userId } } }),
      prisma.wallpaper.findMany({
        where: { uploaderId: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          thumb400Url: true,
          isPublic: true,
          isApproved: true,
          createdAt: true,
          moderationQueue: { select: { status: true, reviewNotes: true } },
        },
      }),
    ]);

  return (
    <UserDetailClient
      currentUserId={session?.user.id ?? ""}
      isProtected={isPrimaryAdminEmail(user.email)}
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role ?? "user",
        banned: user.banned ?? false,
        banReason: user.banReason,
        banExpires: user.banExpires?.toISOString() ?? null,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        wallpaperCount: user._count.wallpapers,
        pendingCount,
        reportsMade,
        reportsAgainst,
      }}
      wallpapers={recentWallpapers.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        thumb400Url: item.thumb400Url,
        isPublic: item.isPublic,
        isApproved: item.isApproved,
        createdAt: item.createdAt.toISOString(),
        queueStatus: item.moderationQueue?.status ?? null,
      }))}
    />
  );
};

export default UserDetailContent;
