import { Card, CardContent, CardHeader } from "@/components/shadcnui/card";
import { Skeleton } from "@/components/shadcnui/skeleton";

const UserDetailLoading = () => {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-14 w-full"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDetailLoading;
