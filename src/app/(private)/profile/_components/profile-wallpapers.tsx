import { Badge } from "@/components/shadcnui/badge";
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
import { format } from "date-fns";
import { ImagesIcon, UploadIcon } from "lucide-react";
import type { Route } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";

const UPLOADS_TAKE = 12;

type UploadListRow = Awaited<ReturnType<typeof fetchUploads>>[number];

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
      moderationQueue: {
        select: { status: true },
      },
    },
  });

const uploadStatus = (row: UploadListRow) => {
  if (row.isApproved) {
    return { label: "Approved", variant: "default" as const };
  }
  if (row.moderationQueue?.status === "REJECTED") {
    return { label: "Rejected", variant: "destructive" as const };
  }
  return { label: "Pending review", variant: "secondary" as const };
};

const ProfileWallpapers = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return null;
  }

  const uploads = await fetchUploads(session.user.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My wallpapers</CardTitle>
        <CardDescription>Your latest uploads</CardDescription>
      </CardHeader>
      <CardContent>
        {uploads.length === 0 ?
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <ImagesIcon className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              You have not uploaded anything yet. Share your first wallpaper.
            </p>
            <Link
              href={"/upload" as Route}
              className={buttonVariants({ variant: "outline", size: "sm" })}>
              <UploadIcon
                data-icon="inline-start"
                className="size-4"
              />
              <span>Upload wallpaper</span>
            </Link>
          </div>
        : <ul className="grid gap-2">
            {uploads.map((row) => {
              const status = uploadStatus(row);
              const src = toImagePath(
                row.thumb400Url ?? row.thumb800Url ?? row.originalUrl,
              );
              // The next/image optimizer fetches /api images server side
              // without a session, so private thumbs are served as a plain
              // img that carries the browser's own credentials.
              const isOptimizable = row.isApproved && row.isPublic;
              return (
                <li key={row.id}>
                  <Link
                    href={`/browse?preview=${row.slug}` as Route}
                    className="hover:bg-muted/40 focus-visible:ring-ring/50 flex items-center gap-3 rounded-xl p-2 transition-colors focus-visible:ring-[3px]">
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
                            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                          />

                      : <span className="bg-muted flex h-full w-full items-center justify-center">
                          <ImagesIcon className="text-muted-foreground size-4" />
                        </span>
                      }
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="truncate text-sm font-medium">
                        {row.title}
                      </span>
                      <time
                        suppressHydrationWarning={true}
                        dateTime={row.createdAt.toISOString()}
                        className="text-muted-foreground text-[11px]">
                        {format(row.createdAt, "MMM d, yyyy")}
                      </time>
                    </span>
                    <Badge variant={status.variant}>{status.label}</Badge>
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

export default ProfileWallpapers;
