import CollectionDetailClient from "@/components/Admin/CollectionDetailClient";
import prisma from "@/lib/database/dbClient";
import { notFound } from "next/navigation";

type Props = {
  collectionId: string;
};

const CollectionDetailContent = async ({ collectionId }: Props) => {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      curator: { select: { id: true, name: true, email: true } },
      items: {
        orderBy: { position: "asc" },
        include: {
          wallpaper: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumb400Url: true,
              thumb800Url: true,
              isPublic: true,
              isApproved: true,
              featured: true,
              editorsPick: true,
              uploader: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });
  if (!collection) {
    notFound();
  }

  return (
    <CollectionDetailClient
      collection={{
        id: collection.id,
        title: collection.title,
        slug: collection.slug,
        description: collection.description,
        coverUrl: collection.coverUrl,
        active: collection.active,
        sortOrder: collection.sortOrder,
        curator: collection.curator,
      }}
      items={collection.items.map((item) => ({
        wallpaperId: item.wallpaperId,
        position: item.position,
        note: item.note,
        wallpaper: {
          id: item.wallpaper.id,
          title: item.wallpaper.title,
          slug: item.wallpaper.slug,
          thumb400Url: item.wallpaper.thumb400Url,
          isPublic: item.wallpaper.isPublic,
          isApproved: item.wallpaper.isApproved,
          featured: item.wallpaper.featured,
          editorsPick: item.wallpaper.editorsPick,
          uploader: item.wallpaper.uploader,
        },
      }))}
    />
  );
};

export default CollectionDetailContent;
