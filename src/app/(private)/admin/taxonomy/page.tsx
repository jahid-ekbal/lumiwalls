import TaxonomyClient from "@/components/Admin/TaxonomyClient";
import prisma from "@/lib/database/dbClient";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Taxonomy",
  description: "Manage taxonomy and categories on Lumiwalls",
});

const TaxonomyPage = async () => {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { wallpapers: true } } },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { wallpapers: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <TaxonomyClient
        categories={categories}
        tags={tags}
      />
    </div>
  );
};

export default TaxonomyPage;
