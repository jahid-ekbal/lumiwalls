import { createMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import { StatsSkeleton } from "../_components/dashboard-skeletons";
import FeaturedContent from "./_components/featured-content";

export const metadata = createMetadata({
  title: "Featured",
  description: "Manage featured wallpapers on Lumiwalls",
});

const FeaturedPage = () => {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Featured
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage featured wallpapers on Lumiwalls
        </p>
      </div>
      <Suspense fallback={<StatsSkeleton />}>
        <FeaturedContent />
      </Suspense>
    </div>
  );
};

export default FeaturedPage;
