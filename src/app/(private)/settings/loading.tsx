import {
  FormCardSkeleton,
  PageHeaderSkeleton,
} from "@/components/UI/Skeletons";
import { Card, CardContent, CardHeader } from "@/components/shadcnui/card";
import { Skeleton } from "@/components/shadcnui/skeleton";

const SettingsLoading = () => {
  return (
    <div className="grid gap-6">
      <PageHeaderSkeleton />
      <div className="grid w-full gap-6 lg:grid-cols-2">
        <FormCardSkeleton fields={3} />
        <div className="grid content-start gap-6">
          <FormCardSkeleton fields={1} />
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsLoading;
