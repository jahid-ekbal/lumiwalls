import { Card, CardContent, CardHeader } from "@/components/shadcnui/card";
import { Skeleton } from "@/components/shadcnui/skeleton";
import { createMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import TaxonomyContent from "./_components/taxonomy-content";

export const metadata = createMetadata({
  title: "Taxonomy",
  description: "Manage taxonomy and categories on Lumiwalls",
});

const TaxonomyFallback = () => {
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

const TaxonomyPage = () => {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <Suspense fallback={<TaxonomyFallback />}>
        <TaxonomyContent />
      </Suspense>
    </div>
  );
};

export default TaxonomyPage;
