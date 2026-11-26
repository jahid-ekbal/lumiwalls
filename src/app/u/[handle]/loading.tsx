import AmbientBackground from "@/components/Ambient/AmbientBackground";
import { Card } from "@/components/shadcnui/card";
import { Skeleton } from "@/components/shadcnui/skeleton";

const PublicProfileLoading = () => {
  return (
    <div className="relative isolate min-h-svh w-full">
      <AmbientBackground />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 pt-6 pb-16 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-36" />

        <Card className="gap-0 overflow-hidden py-0">
          <Skeleton className="h-44 w-full rounded-none sm:h-56" />
          <div className="-mt-10 grid gap-4 px-4 pb-6 sm:px-6">
            <div className="flex items-end justify-between gap-3">
              <Skeleton className="size-20 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="grid gap-2">
                <Skeleton className="aspect-4/3 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfileLoading;
