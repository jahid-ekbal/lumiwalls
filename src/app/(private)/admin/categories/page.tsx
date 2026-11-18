import { Card, CardContent, CardHeader } from "@/components/shadcnui/card";
import { Skeleton } from "@/components/shadcnui/skeleton";
import { createMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import CategoriesContent from "./_components/categories-content";

export const metadata = createMetadata({
  title: "Categories",
  description: "Manage wallpaper categories on Lumiwalls",
});

const CategoriesFallback = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-12 w-full"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const CategoriesPage = () => {
  return (
    <div className="grid gap-6">
      <Suspense fallback={<CategoriesFallback />}>
        <CategoriesContent />
      </Suspense>
    </div>
  );
};

export default CategoriesPage;
