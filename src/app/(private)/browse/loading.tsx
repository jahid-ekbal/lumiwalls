import { PageHeaderSkeleton } from "@/components/UI/Skeletons";
import { Skeleton } from "@/components/shadcnui/skeleton";

const MASONRY_ASPECTS = [
  "aspect-4/5",
  "aspect-16/10",
  "aspect-square",
  "aspect-3/4",
  "aspect-16/9",
  "aspect-9/16",
  "aspect-4/3",
  "aspect-3/5",
  "aspect-16/10",
  "aspect-square",
] as const;

const BrowseLoading = () => {
  return (
    <div className="grid w-full gap-6">
      <PageHeaderSkeleton withAction={true} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-10 w-full rounded-full sm:w-48" />
        <Skeleton className="h-10 w-full rounded-full sm:w-40" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton
            key={index}
            className="h-7 w-24 shrink-0 rounded-full"
          />
        ))}
      </div>
      <div className="grid gap-3">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton
              key={index}
              className="h-48 w-full rounded-inset xl:h-52"
            />
          ))}
        </div>
      </div>
      <div className="columns-1 gap-3.5 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5">
        {MASONRY_ASPECTS.map((aspect, index) => (
          <div
            key={index}
            className="mb-3.5 grid break-inside-avoid gap-2">
            <Skeleton className={`w-full rounded-inset ${aspect}`} />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrowseLoading;
