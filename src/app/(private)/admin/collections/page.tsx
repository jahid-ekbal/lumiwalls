import { createMetadata } from "@/lib/metadata";
import { collectionsSearchParamsSchema } from "@/lib/zodSchema";
import { Suspense } from "react";
import { StatsSkeleton } from "../_components/dashboard-skeletons";
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
      <div className="grid gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Collections
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage wallpaper collections on Lumiwalls
        </p>
      </div>
      <Suspense fallback={<StatsSkeleton />}>
        <CollectionsContent params={params} />
      </Suspense>
    </div>
  );
};

export default CollectionsPage;
