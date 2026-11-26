import { Card, CardContent, CardHeader } from "@/components/shadcnui/card";
import { Skeleton } from "@/components/shadcnui/skeleton";

const EditUploadLoading = () => {
  return (
    <div className="grid gap-6">
        <div className="grid gap-3">
          <Skeleton className="h-8 w-36" />
          <div className="grid gap-1">
            <Skeleton className="h-9 w-44" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-12">
          <Card className="gap-0 overflow-hidden py-0 lg:col-span-4">
            <Skeleton className="aspect-video w-full rounded-none" />
            <CardContent className="grid gap-2 p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>

          <Card className="lg:col-span-8">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="grid gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div className="grid gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default EditUploadLoading;
