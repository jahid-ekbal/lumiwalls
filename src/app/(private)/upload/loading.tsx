import { Card, CardContent } from "@/components/shadcnui/card";
import { Skeleton } from "@/components/shadcnui/skeleton";

const UploadLoading = () => {
  return (
    <div className="w-full p-6">
      <div className="grid gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>

        <Skeleton className="h-10 w-80 rounded-4xl" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card
              key={index}
              className="gap-0 overflow-hidden py-0">
              <Skeleton className="aspect-video w-full rounded-none" />
              <CardContent className="grid gap-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UploadLoading;
