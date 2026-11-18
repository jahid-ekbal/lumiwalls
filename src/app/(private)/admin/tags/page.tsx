import { Card, CardContent, CardHeader } from "@/components/shadcnui/card";
import { Skeleton } from "@/components/shadcnui/skeleton";
import { createMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import TagsContent from "./_components/tags-content";

export const metadata = createMetadata({
  title: "Tags",
  description: "Manage wallpaper tags on Lumiwalls",
});

const TagsFallback = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
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

const TagsPage = () => {
  return (
    <div className="grid gap-6">
      <Suspense fallback={<TagsFallback />}>
        <TagsContent />
      </Suspense>
    </div>
  );
};

export default TagsPage;
