import { PageHeaderSkeleton, TableCardSkeleton } from "@/components/UI/Skeletons";
import { Card } from "@/components/shadcnui/card";
import { Skeleton } from "@/components/shadcnui/skeleton";

const ProfileLoading = () => {
  return (
    <div className="grid gap-6">
      <PageHeaderSkeleton />
      <Skeleton className="h-10 w-52 rounded-control" />
      <Card className="gap-0 overflow-hidden py-0">
        <Skeleton className="h-44 w-full rounded-none sm:h-52" />
        <div className="-mt-10 grid gap-4 px-4 pb-6 sm:px-6">
          <div className="flex items-end justify-between gap-3">
            <Skeleton className="size-20 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
          <div className="grid gap-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </Card>
      <TableCardSkeleton rows={5} />
    </div>
  );
};

export default ProfileLoading;
