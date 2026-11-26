import PageHeader from "@/components/UI/PageHeader";
import { buttonVariants } from "@/components/shadcnui/button";
import { requireAdminUser } from "@/lib/auth/session";
import { createMetadata } from "@/lib/metadata";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import DashboardLinks from "./_components/dashboard-links";
import DashboardModeration from "./_components/dashboard-moderation";
import DashboardRecent from "./_components/dashboard-recent";
import {
  LinksSkeleton,
  MonitorsSkeleton,
  StatsSkeleton,
  TrendSkeleton,
  WatchlistSkeleton,
} from "./_components/dashboard-skeletons";
import DashboardStats from "./_components/dashboard-stats";
import DashboardTrend from "./_components/dashboard-trend";
import { TREND_DAYS } from "./_components/dashboard-utils";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Admin Dashboard",
  description: "Admin dashboard overview on Lumiwalls",
});

const AdminDashboardPage = async () => {
  await requireAdminUser();

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Admin dashboard"
        description={`Platform overview for the last ${TREND_DAYS} days.`}
        actions={
          <Link
            href={"/admin/analytics" as Route}
            className={buttonVariants({ variant: "outline", size: "sm" })}>
            View analytics
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        }
      />

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      <Suspense fallback={<TrendSkeleton />}>
        <DashboardTrend />
      </Suspense>

      <Suspense fallback={<LinksSkeleton />}>
        <DashboardLinks />
      </Suspense>

      <Suspense fallback={<MonitorsSkeleton />}>
        <DashboardModeration />
      </Suspense>

      <Suspense fallback={<WatchlistSkeleton />}>
        <DashboardRecent />
      </Suspense>
    </div>
  );
};

export default AdminDashboardPage;
