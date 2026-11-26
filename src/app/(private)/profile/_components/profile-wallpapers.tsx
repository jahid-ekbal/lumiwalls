import { getActiveSession } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import ProfileLibraryTabs from "./profile-library-tabs";

const LIBRARY_TAKE = 24;

const ProfileWallpapers = async () => {
  const session = await getActiveSession();
  if (!session?.user) {
    return null;
  }

  const [uploads, favorites, boards, downloads] = await Promise.all([
    prisma.wallpaper.findMany({
      where: { uploaderId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: LIBRARY_TAKE,
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        isApproved: true,
        isPublic: true,
        thumb400Url: true,
        thumb800Url: true,
        originalUrl: true,
        blurDataUrl: true,
        moderationQueue: {
          select: { status: true },
        },
      },
    }),
    prisma.favorite.findMany({
      where: {
        userId: session.user.id,
        wallpaper: { isApproved: true, isPublic: true },
      },
      orderBy: { createdAt: "desc" },
      take: LIBRARY_TAKE,
      select: {
        createdAt: true,
        wallpaper: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumb400Url: true,
            thumb800Url: true,
            originalUrl: true,
            blurDataUrl: true,
            uploader: { select: { name: true } },
          },
        },
      },
    }),
    prisma.collection.findMany({
      where: { ownerId: session.user.id, isCurated: false },
      orderBy: { updatedAt: "desc" },
      take: 24,
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        isPublicToMembers: true,
        updatedAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.downloadLog.findMany({
      where: {
        userId: session.user.id,
        wallpaper: { isApproved: true, isPublic: true },
      },
      orderBy: { downloadedAt: "desc" },
      take: LIBRARY_TAKE,
      select: {
        id: true,
        variant: true,
        downloadedAt: true,
        wallpaper: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumb400Url: true,
            thumb800Url: true,
            blurDataUrl: true,
          },
        },
      },
    }),
  ]);

  return (
    <ProfileLibraryTabs
      uploads={uploads.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        createdAt: row.createdAt.toISOString(),
        isApproved: row.isApproved,
        isPublic: row.isPublic,
        thumb400Url: row.thumb400Url,
        thumb800Url: row.thumb800Url,
        originalUrl: row.originalUrl,
        blurDataUrl: row.blurDataUrl,
        moderationStatus: row.moderationQueue?.status ?? null,
      }))}
      favorites={favorites.map((entry) => ({
        id: entry.wallpaper.id,
        title: entry.wallpaper.title,
        slug: entry.wallpaper.slug,
        favoritedAt: entry.createdAt.toISOString(),
        thumb400Url: entry.wallpaper.thumb400Url,
        thumb800Url: entry.wallpaper.thumb800Url,
        originalUrl: entry.wallpaper.originalUrl,
        blurDataUrl: entry.wallpaper.blurDataUrl,
        uploaderName: entry.wallpaper.uploader.name,
      }))}
      boards={boards.map((board) => ({
        id: board.id,
        title: board.title,
        slug: board.slug,
        coverUrl: board.coverUrl,
        isPublicToMembers: board.isPublicToMembers,
        itemCount: board._count.items,
        updatedAt: board.updatedAt.toISOString(),
      }))}
      downloads={downloads.map((log) => ({
        id: log.id,
        wallpaperId: log.wallpaper.id,
        title: log.wallpaper.title,
        slug: log.wallpaper.slug,
        variant: log.variant,
        downloadedAt: log.downloadedAt.toISOString(),
        thumb400Url: log.wallpaper.thumb400Url ?? log.wallpaper.thumb800Url,
        blurDataUrl: log.wallpaper.blurDataUrl,
      }))}
    />
  );
};

export default ProfileWallpapers;
