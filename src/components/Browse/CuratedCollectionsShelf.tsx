import { Badge } from "@/components/shadcnui/badge";
import { buttonVariants } from "@/components/shadcnui/button";
import { formatPluralCount } from "@/lib/format";
import { toImagePath } from "@/lib/imageUrl";
import { ArrowRightIcon, FolderHeartIcon } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

export type CuratedCollectionShelfItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  itemCount: number;
};

const CuratedCollectionsShelf = ({
  collections,
}: {
  collections: CuratedCollectionShelfItem[];
}) => {
  if (collections.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="curated-collections-heading"
      className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2
            id="curated-collections-heading"
            className="text-body-sm text-foreground font-semibold tracking-tight">
            Curated collections
          </h2>
          <Badge variant="outline">{collections.length}</Badge>
        </div>
        <Link
          href={"/collections" as Route}
          className={buttonVariants({ variant: "ghost", size: "xs" })}>
          All collections
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      </div>

      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
        {collections.map((collection) => {
          const coverSrc = toImagePath(collection.coverUrl);
          return (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}` as Route}
              className="group border-border/70 bg-card hover:border-foreground/30 flex h-full w-68 shrink-0 flex-col overflow-hidden rounded-inset border transition-colors sm:w-auto">
              <div className="bg-muted/40 relative h-32 w-full overflow-hidden">
                {coverSrc ?
                  <Image
                    src={coverSrc}
                    alt={collection.title}
                    fill={true}
                    sizes="(max-width: 640px) 272px, 25vw"
                    className="object-cover transition-transform duration-base motion-safe:group-hover:scale-[1.03]"
                  />
                : <div className="flex size-full items-center justify-center">
                    <FolderHeartIcon className="text-muted-foreground size-6" />
                  </div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span className="text-caption absolute right-2.5 bottom-2 rounded-full bg-neutral-950/75 px-2 py-0.5 text-white ring-1 ring-white/15 backdrop-blur-sm">
                  {formatPluralCount(collection.itemCount, "item", "items")}
                </span>
              </div>
              <div className="grid flex-1 content-start gap-0.5 p-3">
                <h3 className="truncate text-sm font-medium">
                  {collection.title}
                </h3>
                {collection.description ?
                  <p className="text-caption text-muted-foreground line-clamp-1">
                    {collection.description}
                  </p>
                : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CuratedCollectionsShelf;
