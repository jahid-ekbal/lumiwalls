import PageHeader from "@/components/UI/PageHeader";
import { TableCardSkeleton } from "@/components/UI/Skeletons";
import { createMetadata } from "@/lib/metadata";
import { reportsSearchParamsSchema } from "@/lib/zodSchema";
import { Suspense } from "react";
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
      <PageHeader
        eyebrow="Trust and safety"
        title="Reports"
        description="Inspect user reports, hide flagged wallpapers, and track resolution status."
      />
      <Suspense fallback={<TableCardSkeleton rows={6} />}>
        <ReportsContent params={params} />
      </Suspense>
    </div>
  );
};

export default ReportsPage;
