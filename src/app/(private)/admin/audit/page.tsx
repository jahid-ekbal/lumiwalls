import PageHeader from "@/components/UI/PageHeader";
import { TableCardSkeleton } from "@/components/UI/Skeletons";
import { createMetadata } from "@/lib/metadata";
import { auditLogSearchParamsSchema } from "@/lib/zodSchema";
import { Suspense } from "react";
import AuditContent from "./_components/audit-content";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Audit Log",
  description: "Review every administrative action on Lumiwalls",
});

const firstParam = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

type AuditPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const AuditPage = async ({ searchParams }: AuditPageProps) => {
  const raw = await searchParams;
  const parsed = auditLogSearchParamsSchema.safeParse({
    q: firstParam(raw.q),
    action: firstParam(raw.action),
    page: firstParam(raw.page),
  });
  const params =
    parsed.success ? parsed.data : auditLogSearchParamsSchema.parse({});

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Audit log"
        description="An immutable record of moderation decisions, account changes, taxonomy edits, placements, and deletions."
      />
      <Suspense fallback={<TableCardSkeleton rows={8} />}>
        <AuditContent params={params} />
      </Suspense>
    </div>
  );
};

export default AuditPage;
