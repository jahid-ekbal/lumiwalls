import { createMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import { StatsSkeleton } from "../../_components/dashboard-skeletons";
import CollectionDetailContent from "./_components/collection-detail-content";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Collection detail",
  description: "Manage items in a collection on Lumiwalls",
});

type Props = {
  params: Promise<{ id: string }>;
};

const CollectionDetailPage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <div className="grid gap-6">
      <Suspense fallback={<StatsSkeleton />}>
        <CollectionDetailContent collectionId={id} />
      </Suspense>
    </div>
  );
};

export default CollectionDetailPage;
