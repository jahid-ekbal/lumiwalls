import { createMetadata } from "@/lib/metadata";
import { reportsSearchParamsSchema } from "@/lib/zodSchema";
import { Suspense } from "react";
import { ModerationSkeleton } from "../_components/dashboard-skeletons";
import ReportsContent from "./_components/reports-content";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Reports",
  description: "View and manage reports on Lumiwalls",
});

const firstParam = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

type ReportsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const ReportsPage = async ({ searchParams }: ReportsPageProps) => {
  const raw = await searchParams;
  const parsed = reportsSearchParamsSchema.safeParse({
    q: firstParam(raw.q),
    reason: firstParam(raw.reason),
    reportStatus: firstParam(raw.reportStatus),
    sort: firstParam(raw.sort),
    page: firstParam(raw.page),
  });
  const params =
    parsed.success ? parsed.data : reportsSearchParamsSchema.parse({});

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
        <ReportsContent params={params} />
      </Suspense>
    </div>
  );
};

export default ReportsPage;
