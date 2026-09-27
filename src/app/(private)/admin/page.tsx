import { buttonVariants } from "@/components/shadcnui/button";
import { createMetadata } from "@/lib/metadata";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import DashboardModeration from "./_components/dashboard-moderation";
import DashboardRecent from "./_components/dashboard-recent";
import {
  ModerationSkeleton,
  RecentSkeleton,
  StatsSkeleton,
  TrendSkeleton,
} from "./_components/dashboard-skeletons";
import DashboardStats from "./_components/dashboard-stats";
import DashboardTrend from "./_components/dashboard-trend";
import { TREND_DAYS } from "./_components/dashboard-utils";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Admin Dashboard",
  description: "Admin dashboard overview on Lumiwalls",
});

const AdminDashboardPage = () => {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Platform overview for the last {TREND_DAYS} days
          </p>
        </div>
        <Link
          href={"/admin/analytics" as Route}
          className={buttonVariants({ variant: "outline" })}>
          <span>View analytics</span>
          <ArrowRightIcon />
        </Link>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      <Suspense fallback={<TrendSkeleton />}>
        <DashboardTrend />
      </Suspense>

      <Suspense fallback={<ModerationSkeleton />}>
        <DashboardModeration />
      </Suspense>

      <Suspense fallback={<RecentSkeleton />}>
        <DashboardRecent />
      </Suspense>
    </div>
  );
};

export default AdminDashboardPage;
