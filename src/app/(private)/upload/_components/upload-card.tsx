"use client";

import { Badge } from "@/components/shadcnui/badge";
import { Button, buttonVariants } from "@/components/shadcnui/button";
import { Card } from "@/components/shadcnui/card";
import { toImagePath } from "@/lib/imageUrl";
import { format } from "date-fns";
import { ImagesIcon, PencilIcon, Trash2Icon } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import DeleteUploadDialog from "./delete-upload-dialog";

type UploadCardWallpaper = {
  id: string;
  title: string;
  slug: string;
  createdAt: Date;
  isApproved: boolean;
  isPublic: boolean;
  thumb400Url: string | null;
  thumb800Url: string | null;
  originalUrl: string | null;
  blurDataUrl: string | null;
  width: number | null;
  height: number | null;
  moderationQueue: { status: string } | null;
};

type UploadCardProps = {
  wallpaper: UploadCardWallpaper;
};

const uploadStatus = (wallpaper: UploadCardWallpaper) => {
  if (wallpaper.isApproved) {
    return { label: "Approved", variant: "default" as const };
  }
  if (wallpaper.moderationQueue?.status === "REJECTED") {
    return { label: "Rejected", variant: "destructive" as const };
  }
  return { label: "Pending review", variant: "secondary" as const };
};

const UploadCard = ({ wallpaper }: UploadCardProps) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const status = uploadStatus(wallpaper);
  const src = toImagePath(
    wallpaper.thumb400Url ?? wallpaper.thumb800Url ?? wallpaper.originalUrl,
  );
  // The next/image optimizer fetches /api images server side without a
  // session, so private thumbs are served as a plain img that carries the
  // browser's own credentials.
  const isOptimizable = wallpaper.isApproved && wallpaper.isPublic;
  const canPreview = wallpaper.isApproved;
  const resolution =
    wallpaper.width && wallpaper.height ?
      `${wallpaper.width} x ${wallpaper.height}`
    : null;

  const image =
    src ?
      isOptimizable ?
        <Image
          src={src}
          alt={wallpaper.title}
          fill={true}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          placeholder={wallpaper.blurDataUrl ? "blur" : "empty"}
          blurDataURL={wallpaper.blurDataUrl ?? undefined}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      : /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={wallpaper.title}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
    : <div className="text-muted-foreground flex size-full items-center justify-center">
        <ImagesIcon className="size-8" />
      </div>;

  return (
    <Card className="group relative gap-0 overflow-hidden py-0">
      <div className="bg-muted/40 relative aspect-video overflow-hidden">
        {canPreview ?
          <Link
            href={`/browse?preview=${wallpaper.slug}` as Route}
            aria-label={`Preview ${wallpaper.title}`}
            className="absolute inset-0 z-10">
            {image}
          </Link>
        : image}

        <Badge
          variant={status.variant}
          className="absolute top-2 left-2 z-20 shadow-sm">
          {status.label}
        </Badge>

        <div className="pointer-events-none absolute inset-0 z-30 flex items-end justify-end gap-2 bg-gradient-to-t from-black/60 via-black/10 to-transparent p-3 opacity-0 transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100">
          <Link
            href={`/upload/${wallpaper.id}/edit` as Route}
            className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <PencilIcon
              data-icon="inline-start"
              className="size-4"
            />
            Edit
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}>
            <Trash2Icon
              data-icon="inline-start"
              className="size-4"
            />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-1 p-3">
        <h3 className="truncate text-sm font-medium">{wallpaper.title}</h3>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <time
            suppressHydrationWarning={true}
            dateTime={wallpaper.createdAt.toISOString()}>
            {format(wallpaper.createdAt, "MMM d, yyyy")}
          </time>
          {resolution ?
            <>
              <span aria-hidden="true">•</span>
              <span>{resolution}</span>
            </>
          : null}
        </div>
      </div>

      <DeleteUploadDialog
        wallpaperId={wallpaper.id}
        title={wallpaper.title}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </Card>
  );
};

export default UploadCard;
