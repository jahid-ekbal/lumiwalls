"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { Badge } from "@/components/shadcnui/badge";
import { Card, CardContent } from "@/components/shadcnui/card";
import { DownloadIcon, EyeIcon, ImagesIcon } from "lucide-react";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { browseParsers } from "./browse-search-params";
import type { BrowseWallpaper } from "./browse-types";

type BrowseGridProps = {
  wallpapers: BrowseWallpaper[];
};

const initials = (name: string) => {
  const source = name.trim();
  if (!source) {
    return "?";
  }
  const parts = source.split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
};

const cardImage = (item: BrowseWallpaper) =>
  item.thumb400Url ?? item.thumb800Url ?? item.thumb1920Url ?? item.originalUrl;

const BrowseGrid = ({ wallpapers }: BrowseGridProps) => {
  const [, setPreview] = useQueryState("preview", browseParsers.preview);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {wallpapers.map((item) => {
        const src = cardImage(item);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              void setPreview(item.slug);
            }}
            aria-label={`Preview ${item.title}`}
            className="group text-left">
            <Card className="group-hover:ring-ring/40 overflow-hidden py-0 transition group-hover:ring-2">
              <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden">
                {src ?
                  <Image
                    src={src}
                    alt={item.title}
                    fill={true}
                    sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    placeholder={item.blurDataUrl ? "blur" : "empty"}
                    blurDataURL={item.blurDataUrl ?? undefined}
                    className="object-cover transition duration-200 group-hover:scale-105"
                  />
                : <div className="flex h-full w-full items-center justify-center">
                    <ImagesIcon className="text-muted-foreground size-6" />
                  </div>
                }
              </div>
              <CardContent className="grid gap-2 px-4 py-4">
                <span className="truncate text-sm font-medium">
                  {item.title}
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {item.category ?
                    <Badge variant="secondary">{item.category.name}</Badge>
                  : null}
                  {item.featured ?
                    <Badge>Featured</Badge>
                  : null}
                  {item.editorsPick ?
                    <Badge variant="outline">Editor pick</Badge>
                  : null}
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {item.tags.slice(0, 3).map((entry) => (
                    <Badge
                      key={entry.tag.id}
                      variant="ghost">
                      {entry.tag.name}
                    </Badge>
                  ))}
                </span>
                <span className="flex items-center justify-between gap-2 pt-1">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Avatar size="sm">
                      {item.uploader.image ?
                        <AvatarImage
                          src={item.uploader.image}
                          alt={item.uploader.name}
                        />
                      : null}
                      <AvatarFallback>
                        {initials(item.uploader.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground truncate text-xs">
                      {item.uploader.name}
                    </span>
                  </span>
                  <span className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
                    <span className="flex items-center gap-1">
                      <EyeIcon className="size-3.5" />
                      {item.viewCount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <DownloadIcon className="size-3.5" />
                      {item.downloadCount.toLocaleString()}
                    </span>
                  </span>
                </span>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
};

export default BrowseGrid;
