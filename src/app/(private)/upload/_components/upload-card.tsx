"use client";

import StatusBadge, { deriveWallpaperStatus } from "@/components/UI/StatusBadge";
import { Button, buttonVariants } from "@/components/shadcnui/button";
import { Card } from "@/components/shadcnui/card";
import { formatDate } from "@/lib/format";
import { toImagePath } from "@/lib/imageUrl";
import { AlertCircleIcon, ImagesIcon, PencilIcon, Trash2Icon } from "lucide-react";
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
  moderationQueue: {
    status: string;
    reviewNotes: string | null;
  } | null;
};

type UploadCardProps = {
  wallpaper: UploadCardWallpaper;
};

const UploadCard = ({ wallpaper }: UploadCardProps) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const status = deriveWallpaperStatus({
    isApproved: wallpaper.isApproved,
    moderationStatus: wallpaper.moderationQueue?.status,
  });
  const src = toImagePath(
    wallpaper.thumb400Url ?? wallpaper.thumb800Url ?? wallpaper.originalUrl,
  );
  // The next/image optimizer fetches /api images server side without a
  // session, so private thumbs are served as a plain img that carries the
  // browser's own credentials.
  const isOptimizable = wallpaper.isApproved && wallpaper.isPublic;
  const canPreview = wallpaper.isApproved && wallpaper.isPublic;
  const resolution =
    wallpaper.width && wallpaper.height ?
      `${wallpaper.width} x ${wallpaper.height}`
    : null;
  const reviewNotes = wallpaper.moderationQueue?.reviewNotes?.trim() || null;

  const image =
    src ?
      isOptimizable ?
        <Image
          src={src}
          alt={wallpaper.title}
          fill={true}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          placeholder={wallpaper.blurDataUrl ? "blur" : "empty"}
          blurDataURL={wallpaper.blurDataUrl ?? undefined}
          className="object-cover transition-transform duration-base motion-safe:group-hover:scale-[1.03]"
        />
      : /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={wallpaper.title}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-base motion-safe:group-hover:scale-[1.03]"
        />
    : <div className="text-muted-foreground flex size-full items-center justify-center">
        <ImagesIcon className="size-8" />
      </div>;

  return (
    <Card className="group relative flex h-full flex-col gap-0 overflow-hidden py-0">
      <div className="bg-muted/40 relative aspect-video shrink-0 overflow-hidden">
        {canPreview ?
          <Link
            href={`/browse?preview=${wallpaper.slug}` as Route}
            aria-label={`Preview ${wallpaper.title}`}
            className="absolute inset-0 z-10">
            {image}
          </Link>
        : image}

        <StatusBadge
          status={status}
          className="absolute top-2.5 left-2.5 z-20 shadow-sm"
        />

        {wallpaper.isApproved && !wallpaper.isPublic ?
          <span className="bg-background/85 text-foreground absolute top-2.5 right-2.5 z-20 rounded-full border px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm">
            Private
          </span>
        : null}

        <div className="pointer-events-none absolute inset-0 z-30 flex items-end justify-end gap-2 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-fast group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100">
          <Link
            href={`/upload/${wallpaper.id}/edit` as Route}
            className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <PencilIcon data-icon="inline-start" />
            Edit
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}>
            <Trash2Icon data-icon="inline-start" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2 p-3.5">
        <div className="grid gap-1">
          <h3 className="text-body-sm truncate font-medium">
            {wallpaper.title}
          </h3>
          <div className="text-caption text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <time
              suppressHydrationWarning={true}
              dateTime={wallpaper.createdAt.toISOString()}>
              {formatDate(wallpaper.createdAt)}
            </time>
            {resolution ?
              <>
                <span aria-hidden="true">&middot;</span>
                <span className="font-mono tabular-nums">{resolution}</span>
              </>
            : null}
          </div>
        </div>

        {status === "REJECTED" && reviewNotes ?
          <p
            title={reviewNotes}
            className="text-destructive bg-destructive/10 flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-xs leading-snug">
            <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
            <span className="line-clamp-2">{reviewNotes}</span>
          </p>
        : null}
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
