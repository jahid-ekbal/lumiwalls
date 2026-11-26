import { PageHeaderSkeleton } from "@/components/UI/Skeletons";
import { Skeleton } from "@/components/shadcnui/skeleton";

const CollectionDetailLoading = () => (
  <div className="grid w-full gap-6">
    <PageHeaderSkeleton withAction={true} />
    <div className="flex gap-2">
      <Skeleton className="h-6 w-28 rounded-full" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
    <div className="columns-1 gap-3.5 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="mb-3.5 grid break-inside-avoid gap-2">
          <Skeleton className="aspect-4/5 w-full rounded-inset" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  </div>
);

export default CollectionDetailLoading;
