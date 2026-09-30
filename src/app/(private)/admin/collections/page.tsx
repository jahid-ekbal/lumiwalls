import { createMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import { StatsSkeleton } from "../_components/dashboard-skeletons";
import CollectionsContent from "./_components/collections-content";

export const metadata = createMetadata({
  title: "Collections",
  description: "Manage wallpaper collections on Lumiwalls",
});

const CollectionsPage = () => {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Collections
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage wallpaper collections on Lumiwalls
        </p>
      </div>
      <Suspense fallback={<StatsSkeleton />}>
        <CollectionsContent />
      </Suspense>
    </div>
  );
};

export default CollectionsPage;
