import { PageHeaderSkeleton } from "@/components/UI/Skeletons";
import { Skeleton } from "@/components/shadcnui/skeleton";

const CollectionsLoading = () => (
  <div className="grid w-full gap-6">
    <PageHeaderSkeleton withAction={true} />
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Skeleton className="h-10 w-80 rounded-control" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-56 rounded-full" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="border-border/60 grid gap-3 overflow-hidden rounded-inset border p-0">
          <Skeleton className="aspect-16/9 w-full rounded-none" />
          <div className="grid gap-2 px-4 pb-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CollectionsLoading;
