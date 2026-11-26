import PageHeader from "@/components/UI/PageHeader";
import { TableCardSkeleton } from "@/components/UI/Skeletons";
import { createMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import CategoriesContent from "./_components/categories-content";

export const metadata = createMetadata({
  title: "Categories",
  description: "Manage wallpaper categories on Lumiwalls",
});

const CategoriesPage = () => {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Taxonomy"
        title="Categories"
        description="Organize wallpapers into browsable categories across Browse and Upload."
      />
      <Suspense fallback={<TableCardSkeleton rows={6} />}>
        <CategoriesContent />
      </Suspense>
    </div>
  );
};

export default CategoriesPage;
