"use client";

import { Badge } from "@/components/shadcnui/badge";
import { toImagePath } from "@/lib/imageUrl";
import { ImagesIcon } from "lucide-react";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { browseParsers } from "./browse-search-params";
import type { BrowseWallpaper } from "./browse-types";

const heroImage = (item: BrowseWallpaper) =>
  toImagePath(
    item.thumb800Url ??
      item.thumb400Url ??
      item.thumb1920Url ??
      item.originalUrl,
  );

const BrowseHero = ({ wallpapers }: { wallpapers: BrowseWallpaper[] }) => {
  const [, setPreview] = useQueryState("preview", browseParsers.preview);

  return (
    <section
      aria-label="Featured wallpapers"
      className="flex snap-x gap-3 overflow-x-auto pb-1 md:grid md:w-auto md:grid-cols-3 md:pb-0 xl:grid-cols-5">
      {wallpapers.map((item) => {
        const src = heroImage(item);
        return (
          <article
            key={item.id}
            className="group/hero relative h-56 w-72 shrink-0 snap-start overflow-hidden rounded-2xl border shadow-lg shadow-black/20 transition-shadow duration-200 md:h-44 md:w-auto md:max-w-none xl:h-56">
            <button
              type="button"
              aria-label={`Open ${item.title}`}
              onClick={() => void setPreview(item.slug)}
              className="absolute inset-0 z-0 cursor-zoom-in"
            />
            {src ?
              <Image
                src={src}
                alt={item.title}
                fill={true}
                sizes="(max-width: 767px) 288px, 20vw"
                placeholder={item.blurDataUrl ? "blur" : "empty"}
                blurDataURL={item.blurDataUrl ?? undefined}
                className="pointer-events-none object-cover transition-transform duration-300 group-hover/hero:scale-[1.03]"
              />
            : <div className="flex h-full w-full items-center justify-center">
                <ImagesIcon className="text-muted-foreground size-6" />
              </div>
            }
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent p-3 pt-10">
              <h3 className="truncate text-sm font-medium text-white">
                {item.title}
              </h3>
              <p className="truncate text-[11px] text-white/70">
                {item.category ? `${item.category.name}` : "Uncategorized"}
              </p>
            </div>
            {item.featured ?
              <Badge className="absolute top-2 left-2 z-[11]">Featured</Badge>
            : item.editorsPick ?
              <Badge
                variant="secondary"
                className="absolute top-2 left-2 z-[11]">
                Editors pick
              </Badge>
            : null}
          </article>
        );
      })}
    </section>
  );
};

export default BrowseHero;
