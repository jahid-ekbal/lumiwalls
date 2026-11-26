import PageHeader from "@/components/UI/PageHeader";
import { AdminAnalyticsSkeleton } from "@/components/UI/Skeletons";
import { createMetadata } from "@/lib/metadata";
import { analyticsSearchParamsSchema } from "@/lib/zodSchema";
import { Suspense } from "react";
import AnalyticsContent from "./_components/analytics-content";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Analytics",
  description: "View analytics on Lumiwalls",
});

const firstParam = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

type AnalyticsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const AnalyticsPage = async ({ searchParams }: AnalyticsPageProps) => {
  const raw = await searchParams;
  const parsed = analyticsSearchParamsSchema.safeParse({
    range: firstParam(raw.range),
  });
  const params =
    parsed.success ? parsed.data : analyticsSearchParamsSchema.parse({});

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Analytics"
        description="Platform activity, top-performing wallpapers, moderation latency, and storage footprint."
      />
      <Suspense fallback={<AdminAnalyticsSkeleton />}>
        <AnalyticsContent params={params} />
      </Suspense>
    </div>
  );
};

export default AnalyticsPage;
