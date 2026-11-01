import { buttonVariants } from "@/components/shadcnui/button";
import { createMetadata } from "@/lib/metadata";
import { CompassIcon, UploadIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import DashboardActivityFeed from "./_components/dashboard-activity-feed";
import DashboardFavorites from "./_components/dashboard-favorites";
import {
  ActivitySkeleton,
  FavoritesSkeleton,
  ReportsSkeleton,
  StatsSkeleton,
  StorageSkeleton,
  TrendSkeleton,
  UploadsSkeleton,
} from "./_components/dashboard-skeletons";
import DashboardReports from "./_components/dashboard-reports";
import DashboardStats from "./_components/dashboard-stats";
import DashboardStorage from "./_components/dashboard-storage";
import DashboardUploadsList from "./_components/dashboard-uploads-list";
import DashboardUploadsTrend from "./_components/dashboard-uploads-trend";
import { TREND_DAYS } from "./_components/dashboard-utils";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Dashboard",
  description: "Your personal dashboard overview on Lumiwalls",
});

const DashboardPage = () => {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Your uploads, favorites, and activity over the last {TREND_DAYS}{" "}
            days and beyond
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={"/browse" as Route}
            className={buttonVariants({ variant: "outline" })}>
            <CompassIcon />
            <span>Browse</span>
          </Link>
          <Link
            href={"/upload" as Route}
            className={buttonVariants({ variant: "default" })}>
            <UploadIcon />
            <span>Upload</span>
          </Link>
        </div>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      <Suspense fallback={<TrendSkeleton />}>
        <DashboardUploadsTrend />
      </Suspense>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Suspense fallback={<FavoritesSkeleton />}>
          <DashboardFavorites />
        </Suspense>
        <Suspense fallback={<UploadsSkeleton />}>
          <DashboardUploadsList />
        </Suspense>
      </div>

      <Suspense fallback={<ActivitySkeleton />}>
        <DashboardActivityFeed />
      </Suspense>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Suspense fallback={<ReportsSkeleton />}>
          <DashboardReports />
        </Suspense>
        <Suspense fallback={<StorageSkeleton />}>
          <DashboardStorage />
        </Suspense>
      </div>
    </div>
  );
};

export default DashboardPage;
