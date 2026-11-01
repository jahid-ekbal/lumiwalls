import { Card, CardContent, CardHeader } from "@/components/shadcnui/card";
import { Skeleton } from "@/components/shadcnui/skeleton";

const DashboardLoading = () => {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }).map((_, index) => (
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
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <div className="grid items-start gap-6 lg:grid-cols-2">
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
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
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
      </div>
    </div>
  );
};

export default DashboardLoading;
