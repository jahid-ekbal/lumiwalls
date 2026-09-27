import TaxonomyClient from "@/components/Admin/TaxonomyClient";
import prisma from "@/lib/database/dbClient";

const TaxonomyContent = async () => {
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
    <TaxonomyClient
      categories={categories}
      tags={tags}
    />
  );
};

export default TaxonomyContent;
