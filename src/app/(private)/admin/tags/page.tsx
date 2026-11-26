import PageHeader from "@/components/UI/PageHeader";
import { TableCardSkeleton } from "@/components/UI/Skeletons";
import { createMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import TagsContent from "./_components/tags-content";

export const metadata = createMetadata({
  title: "Tags",
  description: "Manage wallpaper tags on Lumiwalls",
});

const TagsPage = () => {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Taxonomy"
        title="Tags"
        description="Manage selectable tags users apply when submitting wallpapers."
      />
      <Suspense fallback={<TableCardSkeleton rows={6} />}>
        <TagsContent />
      </Suspense>
    </div>
  );
};

export default TagsPage;
