import { PageHeaderSkeleton } from "@/components/UI/Skeletons";
import { Skeleton } from "@/components/shadcnui/skeleton";

const BrowseLoading = () => {
  return (
    <div className="grid gap-6">
      <PageHeaderSkeleton withAction={true} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-full sm:w-56" />
        <Skeleton className="h-9 w-full sm:w-48" />
      </div>
      <div className="grid gap-3">
        <Skeleton className="h-3.5 w-24" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton
              key={index}
              className="h-44 w-full xl:h-52"
            />
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="grid gap-2">
            <Skeleton className="h-65 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrowseLoading;
