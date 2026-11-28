import TagClient from "@/components/Admin/TagClient";
import { requireAdminUser } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";

const TagsContent = async () => {
  await requireAdminUser();
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { wallpapers: true } } },
  });

  return <TagClient tags={tags} />;
};

export default TagsContent;
