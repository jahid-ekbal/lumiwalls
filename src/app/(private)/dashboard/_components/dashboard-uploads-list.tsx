import EmptyState from "@/components/UI/EmptyState";
import StatusBadge, { deriveWallpaperStatus } from "@/components/UI/StatusBadge";
import { buttonVariants } from "@/components/shadcnui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { formatDate } from "@/lib/format";
import { toImagePath } from "@/lib/imageUrl";
import { ArrowRightIcon, ImagesIcon, UploadIcon } from "lucide-react";
import type { Route } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";

const UPLOADS_TAKE = 6;

const fetchUploads = (userId: string) =>
  prisma.wallpaper.findMany({
    where: { uploaderId: userId },
    orderBy: { createdAt: "desc" },
    take: UPLOADS_TAKE,
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
      width: true,
      height: true,
      moderationQueue: {
        select: { status: true },
      },
    },
  });

const DashboardUploadsList = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

  const uploads = await fetchUploads(session.user.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My uploads</CardTitle>
        <CardDescription>Your latest wallpapers</CardDescription>
        <CardAction>
          <Link
            href={"/upload" as Route}
            className={buttonVariants({ variant: "ghost", size: "sm" })}>
            View all
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {uploads.length === 0 ?
          <EmptyState
            compact={true}
            icon={ImagesIcon}
            title="No uploads yet"
            description="You have not uploaded anything yet. Share your first wallpaper."
            action={
              <Link
                href={"/upload/new" as Route}
                className={buttonVariants({ variant: "outline", size: "sm" })}>
                <UploadIcon data-icon="inline-start" />
                Upload wallpaper
              </Link>
            }
          />
        : <ul className="grid gap-2">
            {uploads.map((row) => {
              const status = deriveWallpaperStatus({
                isApproved: row.isApproved,
                moderationStatus: row.moderationQueue?.status,
              });
              const src = toImagePath(
                row.thumb400Url ?? row.thumb800Url ?? row.originalUrl,
              );
              const isOptimizable = row.isApproved && row.isPublic;
              return (
                <li key={row.id}>
                  <Link
                    href={`/browse?preview=${row.slug}` as Route}
                    className="hover:bg-muted/40 focus-visible:ring-ring/50 flex items-center gap-3 rounded-inset p-2 transition-colors outline-none focus-visible:ring-3">
                    <span className="ring-foreground/5 relative block h-10 w-16 shrink-0 overflow-hidden rounded-lg ring-1">
                      {src ?
                        isOptimizable ?
                          <Image
                            src={src}
                            alt={row.title}
                            fill={true}
                            sizes="64px"
                            placeholder={row.blurDataUrl ? "blur" : "empty"}
                            blurDataURL={row.blurDataUrl ?? undefined}
                            className="pointer-events-none object-cover"
                          />
                        : /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={src}
                            alt={row.title}
                            loading="lazy"
                            className="pointer-events-none absolute inset-0 size-full object-cover"
                          />
                      : <span className="bg-muted flex size-full items-center justify-center">
                          <ImagesIcon className="text-muted-foreground size-4" />
                        </span>
                      }
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="text-body-sm truncate font-medium">
                        {row.title}
                      </span>
                      <time
                        suppressHydrationWarning={true}
                        dateTime={row.createdAt.toISOString()}
                        className="text-caption text-muted-foreground">
                        {formatDate(row.createdAt)}
                      </time>
                    </span>
                    <StatusBadge status={status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        }
      </CardContent>
    </Card>
  );
};

export default DashboardUploadsList;
