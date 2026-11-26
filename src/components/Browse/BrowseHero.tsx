"use client";

import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { toImagePath } from "@/lib/imageUrl";
import { ChevronLeftIcon, ChevronRightIcon, ImagesIcon } from "lucide-react";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { useRef } from "react";
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
  const railRef = useRef<HTMLDivElement>(null);

  const scrollRail = (direction: -1 | 1) => {
    const node = railRef.current;
    if (!node) {
      return;
    }
    node.scrollBy({ left: direction * 300, behavior: "smooth" });
  };

  return (
    <section
      aria-labelledby="featured-rail-heading"
      className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2
            id="featured-rail-heading"
            className="text-body-sm text-foreground font-semibold tracking-tight">
            Featured
          </h2>
          <span className="text-caption text-muted-foreground tabular-nums">
            {wallpapers.length}
          </span>
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Scroll featured wallpapers left"
            onClick={() => scrollRail(-1)}>
            <ChevronLeftIcon aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Scroll featured wallpapers right"
            onClick={() => scrollRail(1)}>
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={railRef}
          tabIndex={0}
          role="region"
          aria-label="Featured wallpapers rail"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              scrollRail(1);
            } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              scrollRail(-1);
            }
          }}
          className="no-scrollbar focus-visible:ring-ring/50 flex snap-x gap-3 overflow-x-auto rounded-surface pb-1 outline-none focus-visible:ring-3 md:grid md:w-auto md:grid-cols-3 md:overflow-visible md:pb-0 xl:grid-cols-5">
          {wallpapers.map((item, index) => {
            const src = heroImage(item);
            return (
              <article
                key={item.id}
                style={{ "--stagger": Math.min(index, 4) } as React.CSSProperties}
                className="gallery-stagger group/hero bg-card relative h-48 w-72 shrink-0 snap-start overflow-hidden rounded-inset border border-border/70 transition-colors duration-base hover:border-foreground/30 md:h-48 md:w-auto xl:h-52">
                <button
                  type="button"
                  aria-label={`Open ${item.title}`}
                  onClick={() => void setPreview(item.slug)}
                  className="focus-visible:ring-ring/60 absolute inset-0 z-10 cursor-zoom-in rounded-inset outline-none focus-visible:ring-3 focus-visible:ring-inset"
                />
                {src ?
                  <Image
                    src={src}
                    alt={item.title}
                    fill={true}
                    sizes="(max-width: 767px) 288px, 20vw"
                    placeholder={item.blurDataUrl ? "blur" : "empty"}
                    blurDataURL={item.blurDataUrl ?? undefined}
                    className="pointer-events-none object-cover transition-transform duration-base motion-safe:group-hover/hero:scale-[1.03]"
                  />
                : <div className="flex size-full items-center justify-center">
                    <ImagesIcon className="text-muted-foreground size-6" />
                  </div>
                }
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-3 pt-10">
                  <h3 className="text-body-sm truncate font-medium text-white">
                    {item.title}
                  </h3>
                  <p className="text-caption truncate text-white/75">
                    {item.category ? item.category.name : "Uncategorized"}
                  </p>
                </div>
                {item.featured ?
                  <Badge className="pointer-events-none absolute top-2.5 left-2.5 z-20">
                    Featured
                  </Badge>
                : item.editorsPick ?
                  <Badge
                    variant="secondary"
                    className="pointer-events-none absolute top-2.5 left-2.5 z-20">
                    Editors pick
                  </Badge>
                : null}
              </article>
            );
          })}
        </div>
        <div
          aria-hidden="true"
          className="from-background pointer-events-none absolute inset-y-0 right-0 z-20 w-8 bg-gradient-to-l to-transparent md:hidden"
        />
      </div>
    </section>
  );
};

export default BrowseHero;
