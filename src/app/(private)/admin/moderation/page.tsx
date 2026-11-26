import PageHeader from "@/components/UI/PageHeader";
import { TableCardSkeleton } from "@/components/UI/Skeletons";
import { createMetadata } from "@/lib/metadata";
import { moderationSearchParamsSchema } from "@/lib/zodSchema";
import { Suspense } from "react";
import ModerationContent from "./_components/moderation-content";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Moderation",
  description: "Moderate content and submissions on Lumiwalls",
});

const firstParam = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

type ModerationPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const ModerationPage = async ({ searchParams }: ModerationPageProps) => {
  const raw = await searchParams;
  const parsed = moderationSearchParamsSchema.safeParse({
    tab: firstParam(raw.tab),
    status: firstParam(raw.status),
    reportStatus: firstParam(raw.reportStatus),
    q: firstParam(raw.q),
    category: firstParam(raw.category),
    sort: firstParam(raw.sort),
    page: firstParam(raw.page),
  });
  const params =
    parsed.success ? parsed.data : moderationSearchParamsSchema.parse({});
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Trust and safety"
        title="Moderation"
        description="Review pending wallpaper submissions and resolve community reports."
      />
      <Suspense fallback={<TableCardSkeleton rows={6} />}>
        <ModerationContent params={params} />
      </Suspense>
    </div>
  );
};

export default ModerationPage;
