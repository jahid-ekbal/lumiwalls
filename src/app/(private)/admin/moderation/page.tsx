import { createMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import { ModerationSkeleton } from "../_components/dashboard-skeletons";
import ModerationContent from "./_components/moderation-content";

export const metadata = createMetadata({
  title: "Moderation",
  description: "Moderate content and submissions on Lumiwalls",
});

const ModerationPage = () => {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Moderation
        </h1>
        <p className="text-muted-foreground text-sm">
          Moderate content and submissions on Lumiwalls
        </p>
      </div>
      <Suspense fallback={<ModerationSkeleton />}>
        <ModerationContent />
      </Suspense>
    </div>
  );
};

export default ModerationPage;
