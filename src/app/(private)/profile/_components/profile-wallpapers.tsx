import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { headers } from "next/headers";
import ProfileLibraryTabs from "./profile-library-tabs";

const LIBRARY_TAKE = 12;

const ProfileWallpapers = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return null;
  }

  const [uploads, favorites] = await Promise.all([
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
    />
  );
};

export default ProfileWallpapers;
