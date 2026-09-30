import { createMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import { ModerationSkeleton } from "../_components/dashboard-skeletons";
import ReportsContent from "./_components/reports-content";

export const metadata = createMetadata({
  title: "Reports",
  description: "View and manage reports on Lumiwalls",
});

const ReportsPage = () => {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Reports
        </h1>
        <p className="text-muted-foreground text-sm">
          View and manage reports on Lumiwalls
        </p>
      </div>
      <Suspense fallback={<ModerationSkeleton />}>
        <ReportsContent />
      </Suspense>
    </div>
  );
};

export default ReportsPage;
