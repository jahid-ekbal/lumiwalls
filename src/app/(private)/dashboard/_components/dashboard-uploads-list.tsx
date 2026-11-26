import StatusBadge from "@/components/UI/StatusBadge";
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
import { formatDistanceToNow } from "date-fns";
import { ArrowRightIcon, ImageIcon, UploadIcon } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { resolveModerationStatus } from "./dashboard-utils";

const DashboardUploadsList = async () => {
  const session = await getActiveSession();

  if (!session?.user) {
    return null;
  }

  const recentUploads = await prisma.wallpaper.findMany({
    where: { uploaderId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      title: true,
      slug: true,
      thumb400Url: true,
      blurDataUrl: true,
      isApproved: true,
      isPublic: true,
      createdAt: true,
      moderationQueue: { select: { status: true } },
    },
  });

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Recent uploads</CardTitle>
        <CardDescription>
          Status of your latest wallpaper submissions
        </CardDescription>
        <CardAction>
          <Link
            href={"/upload" as Route}
            className={buttonVariants({ variant: "ghost", size: "xs" })}>
            Manage
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        {recentUploads.length === 0 ?
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="bg-muted flex size-10 items-center justify-center rounded-full">
              <ImageIcon
                aria-hidden="true"
                className="text-muted-foreground size-5"
              />
            </div>
            <div className="grid gap-1">
              <p className="text-body-sm font-medium">No uploads yet</p>
              <p className="text-caption text-muted-foreground max-w-xs">
                Upload a wallpaper to start building your library and tracking
                views.
              </p>
            </div>
            <Link
              href={"/upload/new" as Route}
              className={buttonVariants({ size: "sm" })}>
              <UploadIcon data-icon="inline-start" />
              Upload wallpaper
            </Link>
          </div>
        : <ul className="grid gap-2">
            {recentUploads.map((row) => {
              const status = resolveModerationStatus(
                row.isApproved,
                row.moderationQueue?.status,
              );
              const thumbSrc = toImagePath(row.thumb400Url);
              const href = (
                row.isApproved && row.isPublic ?
                  `/browse?preview=${row.slug}`
                : `/upload/${row.id}/edit`) as Route;

              return (
                <li key={row.id}>
                  <Link
                    href={href}
                    className="hover:bg-muted/60 focus-visible:ring-ring/50 flex items-center gap-3 rounded-xl p-2 transition-colors outline-none focus-visible:ring-2">
                    <div className="bg-muted relative h-10 w-16 shrink-0 overflow-hidden rounded-lg">
                      {thumbSrc ?
                        <Image
                          src={thumbSrc}
                          alt={row.title}
                          fill
                          sizes="64px"
                          placeholder={row.blurDataUrl ? "blur" : "empty"}
                          blurDataURL={row.blurDataUrl ?? undefined}
                          className="object-cover"
                        />
                      : <span className="text-muted-foreground flex size-full items-center justify-center">
                          <ImageIcon
                            aria-hidden="true"
                            className="size-4"
                          />
                        </span>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm truncate font-medium">
                        {row.title}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        {formatDistanceToNow(row.createdAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <StatusBadge
                      status={status}
                      className="shrink-0"
                    />
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
