import { buttonVariants } from "@/components/shadcnui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { getActiveSession } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { toImagePath } from "@/lib/imageUrl";
import { ArrowRightIcon, HeartIcon } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

const DashboardFavorites = async () => {
  const session = await getActiveSession();

  if (!session?.user) {
    return null;
  }

  const favorites = await prisma.favorite.findMany({
    where: {
      userId: session.user.id,
      wallpaper: { isApproved: true, isPublic: true },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      wallpaper: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumb400Url: true,
          blurDataUrl: true,
        },
      },
    },
  });

  return (
    <Card
      id="favorites"
      className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Favorites</CardTitle>
        <CardDescription>Wallpapers you have recently saved</CardDescription>
        <CardAction>
          <Link
            href={"/profile?tab=favorites" as Route}
            className={buttonVariants({ variant: "ghost", size: "xs" })}>
            View all
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        {favorites.length === 0 ?
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="bg-muted flex size-10 items-center justify-center rounded-full">
              <HeartIcon
                aria-hidden="true"
                className="text-muted-foreground size-5"
              />
            </div>
            <div className="grid gap-1">
              <p className="text-body-sm font-medium">No favorites yet</p>
              <p className="text-caption text-muted-foreground max-w-xs">
                Save wallpapers while browsing to keep them within easy reach.
              </p>
            </div>
            <Link
              href={"/browse" as Route}
              className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Explore Browse
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </div>
        : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {favorites.map((favorite) => {
              const thumbSrc = toImagePath(favorite.wallpaper.thumb400Url);
              return (
                <Link
                  key={favorite.id}
                  href={`/browse?preview=${favorite.wallpaper.slug}` as Route}
                  className="bg-muted group relative block aspect-4/3 overflow-hidden rounded-xl ring-1 ring-white/5 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none">
                  {thumbSrc ?
                    <Image
                      src={thumbSrc}
                      alt={favorite.wallpaper.title}
                      fill
                      sizes="(max-width: 640px) 45vw, 180px"
                      placeholder={
                        favorite.wallpaper.blurDataUrl ? "blur" : "empty"
                      }
                      blurDataURL={favorite.wallpaper.blurDataUrl ?? undefined}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  : null}
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/35 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-xs font-medium text-white">
                      {favorite.wallpaper.title}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        }
      </CardContent>
    </Card>
  );
};

export default DashboardFavorites;
