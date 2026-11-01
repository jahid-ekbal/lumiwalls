import { buttonVariants } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { toImagePath } from "@/lib/imageUrl";
import { CompassIcon, HeartIcon, ImagesIcon } from "lucide-react";
import type { Route } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";

const FAVORITES_TAKE = 6;

const DashboardFavorites = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: FAVORITES_TAKE,
    select: {
      wallpaper: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumb400Url: true,
          thumb800Url: true,
          thumb1920Url: true,
          originalUrl: true,
          blurDataUrl: true,
          width: true,
          height: true,
        },
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Favorites</CardTitle>
        <CardDescription>
          The wallpapers you saved, newest first
        </CardDescription>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ?
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <HeartIcon className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              Nothing saved yet. Open a wallpaper on Browse and hit Favorite.
            </p>
            <Link
              href={"/browse" as Route}
              className={buttonVariants({ variant: "outline", size: "sm" })}>
              <CompassIcon
                data-icon="inline-start"
                className="size-4"
              />
              <span>Browse wallpapers</span>
            </Link>
          </div>
        : <div className="grid grid-cols-3 gap-3">
            {favorites.map(({ wallpaper }) => {
              const src = toImagePath(
                wallpaper.thumb400Url ??
                  wallpaper.thumb800Url ??
                  wallpaper.thumb1920Url ??
                  wallpaper.originalUrl,
              );
              return (
                <Link
                  key={wallpaper.id}
                  href={`/browse?preview=${wallpaper.slug}` as Route}
                  aria-label={`Open ${wallpaper.title}`}
                  className="group ring-foreground/5 focus-visible:ring-ring/50 relative block overflow-hidden rounded-xl ring-1 transition-shadow duration-200 hover:shadow-lg hover:shadow-black/20 focus-visible:ring-[3px]">
                  {src ?
                    <Image
                      src={src}
                      alt={wallpaper.title}
                      width={wallpaper.width ?? 800}
                      height={wallpaper.height ?? 600}
                      sizes="(max-width: 1024px) 45vw, 220px"
                      placeholder={wallpaper.blurDataUrl ? "blur" : "empty"}
                      blurDataURL={wallpaper.blurDataUrl ?? undefined}
                      className="pointer-events-none aspect-4/3 h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                    />
                  : <div className="bg-muted flex aspect-4/3 w-full items-center justify-center">
                      <ImagesIcon className="text-muted-foreground size-5" />
                    </div>
                  }
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-[11px] font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <span className="line-clamp-1">{wallpaper.title}</span>
                  </span>
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
