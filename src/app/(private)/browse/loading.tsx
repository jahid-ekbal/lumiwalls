import { Skeleton } from "@/components/shadcnui/skeleton";

const BrowseLoading = () => {
  return (
    <div className="w-full p-6">
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-full sm:w-56" />
          <Skeleton className="h-9 w-full sm:w-48" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
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
    </div>
  );
};

export default BrowseLoading;
