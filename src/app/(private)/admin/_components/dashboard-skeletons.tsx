import { Card, CardContent, CardHeader } from "@/components/shadcnui/card";
import { Skeleton } from "@/components/shadcnui/skeleton";

export const StatsSkeleton = () => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const TrendSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
};

export const ModerationSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-16 w-full"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const MonitorsSkeleton = () => {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-4 w-56" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const WatchlistSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-12 w-full"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const LinksSkeleton = () => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index}>
          <CardContent>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const StorageSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-[68px] w-44 rounded-2xl"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
