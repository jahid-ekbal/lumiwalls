import { createMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import {
  StatsSkeleton,
  TrendSkeleton,
} from "../_components/dashboard-skeletons";
import AnalyticsContent from "./_components/analytics-content";

export const metadata = createMetadata({
  title: "Analytics",
  description: "View analytics and insights on Lumiwalls",
});

const AnalyticsFallback = () => {
  return (
    <div className="grid gap-6">
      <StatsSkeleton />
      <TrendSkeleton />
    </div>
  );
};

const AnalyticsPage = () => {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Analytics
        </h1>
        <p className="text-muted-foreground text-sm">
          View analytics and insights on Lumiwalls
        </p>
      </div>
      <Suspense fallback={<AnalyticsFallback />}>
        <AnalyticsContent />
      </Suspense>
    </div>
  );
};

export default AnalyticsPage;
