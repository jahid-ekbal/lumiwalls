import { Card, CardContent, CardHeader } from "@/components/shadcnui/card";
import { Skeleton } from "@/components/shadcnui/skeleton";
import { cn } from "@/lib/utils";

export const PageHeaderSkeleton = ({
  withAction = false,
}: {
  withAction?: boolean;
}) => (
  <div className="border-border/60 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="grid gap-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-52" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
    {withAction ?
      <Skeleton className="h-9 w-36" />
    : null}
  </div>
);

export const StatGridSkeleton = ({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) => (
  <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
    {Array.from({ length: count }).map((_, index) => (
      <Card
        key={index}
        size="sm">
        <CardHeader className="pb-0">
          <Skeleton className="h-3.5 w-24" />
        </CardHeader>
        <CardContent className="grid gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-36" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const ChartCardSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-4 w-64 max-w-full" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
);

export const TableCardSkeleton = ({
  rows = 5,
  rowHeight = "h-12",
}: {
  rows?: number;
  rowHeight?: string;
}) => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-4 w-64 max-w-full" />
    </CardHeader>
    <CardContent className="grid gap-2">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("w-full", rowHeight)}
        />
      ))}
    </CardContent>
  </Card>
);

export const FormCardSkeleton = ({ fields = 3 }: { fields?: number }) => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-4 w-56 max-w-full" />
    </CardHeader>
    <CardContent className="grid gap-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div
          key={index}
          className="grid gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <Skeleton className="h-9 w-32" />
    </CardContent>
  </Card>
);

export const AdminOverviewSkeleton = () => (
  <div className="grid gap-6">
    <PageHeaderSkeleton withAction={true} />
    <StatGridSkeleton
      count={6}
      className="xl:grid-cols-3"
    />
    <ChartCardSkeleton />
    <TableCardSkeleton rows={5} />
  </div>
);

export const AdminTablePageSkeleton = ({
  rows = 6,
  rowHeight = "h-12",
}: {
  rows?: number;
  rowHeight?: string;
}) => (
  <div className="grid gap-6">
    <PageHeaderSkeleton withAction={true} />
    <TableCardSkeleton
      rows={rows}
      rowHeight={rowHeight}
    />
  </div>
);

export const AdminAnalyticsSkeleton = () => (
  <div className="grid gap-6">
    <PageHeaderSkeleton withAction={true} />
    <StatGridSkeleton
      count={4}
      className="xl:grid-cols-4"
    />
    <ChartCardSkeleton />
    <div className="grid gap-4 lg:grid-cols-2">
      <TableCardSkeleton rows={4} />
      <TableCardSkeleton rows={4} />
    </div>
  </div>
);

export const AdminDetailSkeleton = () => (
  <div className="grid gap-6">
    <PageHeaderSkeleton />
    <TableCardSkeleton
      rows={4}
      rowHeight="h-14"
    />
  </div>
);
