import TagClient from "@/components/Admin/TagClient";
import prisma from "@/lib/database/dbClient";

const TagsContent = async () => {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { wallpapers: true } } },
  });

  return <TagClient tags={tags} />;
};

export default TagsContent;
