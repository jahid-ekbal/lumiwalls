import CategoryClient from "@/components/Admin/CategoryClient";
import { requireAdminUser } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";

const CategoriesContent = async () => {
  await requireAdminUser();
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { wallpapers: true } } },
  });

  return <CategoryClient categories={categories} />;
};

export default CategoriesContent;
