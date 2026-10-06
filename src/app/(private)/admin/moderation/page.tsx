import { createMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import { ModerationSkeleton } from "../_components/dashboard-skeletons";
import ModerationContent from "./_components/moderation-content";
import { moderationSearchParamsSchema } from "@/lib/zodSchema";

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
      <div className="grid gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Moderation
        </h1>
        <p className="text-muted-foreground text-sm">
          Moderate content and submissions on Lumiwalls
        </p>
      </div>
      <Suspense fallback={<ModerationSkeleton />}>
        <ModerationContent params={params} />
      </Suspense>
    </div>
  );
};

export default ModerationPage;
