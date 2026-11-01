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

export const FavoritesSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-52" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="aspect-4/3 rounded-xl"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const UploadsSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-44" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2">
              <Skeleton className="h-10 w-16 rounded-lg" />
              <div className="grid flex-1 gap-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-24 rounded-3xl" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const ActivitySkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2">
              <Skeleton className="size-7 rounded-full" />
              <div className="grid flex-1 gap-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const ReportsSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-10 w-full rounded-lg"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const StorageSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl p-3">
              <Skeleton className="size-9 rounded-lg" />
              <div className="grid flex-1 gap-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
