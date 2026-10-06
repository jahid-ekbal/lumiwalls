import { createMetadata } from "@/lib/metadata";
import { analyticsSearchParamsSchema } from "@/lib/zodSchema";
import { Suspense } from "react";
import { StatsSkeleton } from "../_components/dashboard-skeletons";
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
      <div className="grid gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Analytics
        </h1>
        <p className="text-muted-foreground text-sm">
          View analytics on Lumiwalls
        </p>
      </div>
      <Suspense fallback={<StatsSkeleton />}>
        <AnalyticsContent params={params} />
      </Suspense>
    </div>
  );
};

export default AnalyticsPage;
