import PageHeader from "@/components/UI/PageHeader";
import { TableCardSkeleton } from "@/components/UI/Skeletons";
import { createMetadata } from "@/lib/metadata";
import { collectionsSearchParamsSchema } from "@/lib/zodSchema";
import { Suspense } from "react";
import CollectionsContent from "./_components/collections-content";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Collections",
  description: "Manage wallpaper collections on Lumiwalls",
});

const firstParam = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

type CollectionsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const CollectionsPage = async ({ searchParams }: CollectionsPageProps) => {
  const raw = await searchParams;
  const parsed = collectionsSearchParamsSchema.safeParse({
    q: firstParam(raw.q),
    status: firstParam(raw.status),
    sort: firstParam(raw.sort),
    page: firstParam(raw.page),
  });
  const params =
    parsed.success ? parsed.data : collectionsSearchParamsSchema.parse({});

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Curation"
        title="Collections"
        description="Curate editorial sets of approved wallpapers."
      />
      <Suspense fallback={<TableCardSkeleton rows={6} />}>
        <CollectionsContent params={params} />
      </Suspense>
    </div>
  );
};

export default CollectionsPage;
