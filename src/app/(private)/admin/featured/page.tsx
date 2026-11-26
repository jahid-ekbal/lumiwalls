import PageHeader from "@/components/UI/PageHeader";
import { TableCardSkeleton } from "@/components/UI/Skeletons";
import { createMetadata } from "@/lib/metadata";
import { featuredSearchParamsSchema } from "@/lib/zodSchema";
import { Suspense } from "react";
import FeaturedContent from "./_components/featured-content";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Featured",
  description: "Manage featured wallpapers on Lumiwalls",
});

const firstParam = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

type FeaturedPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const FeaturedPage = async ({ searchParams }: FeaturedPageProps) => {
  const raw = await searchParams;
  const parsed = featuredSearchParamsSchema.safeParse({
    tab: firstParam(raw.tab),
    q: firstParam(raw.q),
    flag: firstParam(raw.flag),
    placement: firstParam(raw.placement),
    window: firstParam(raw.window),
    sort: firstParam(raw.sort),
    page: firstParam(raw.page),
  });
  const params =
    parsed.success ? parsed.data : featuredSearchParamsSchema.parse({});

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Curation"
        title="Featured"
        description="Control featured flags, editors picks, and scheduled placements."
      />
      <Suspense fallback={<TableCardSkeleton rows={6} />}>
        <FeaturedContent params={params} />
      </Suspense>
    </div>
  );
};

export default FeaturedPage;
