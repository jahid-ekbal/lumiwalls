"use client";

import EmptyState from "@/components/UI/EmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/shadcnui/chart";
import { formatCount } from "@/lib/format";
import { BarChart3Icon } from "lucide-react";
import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export type TrendPoint = {
  date: string;
  label: string;
  wallpapers: number;
  users: number;
};

const chartConfig = {
  wallpapers: {
    label: "Uploads",
    color: "var(--chart-1)",
  },
  users: {
    label: "New users",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const AdminTrendChart = ({
  data,
  description = "Daily totals for the last 30 days",
}: {
  data: TrendPoint[];
  description?: string;
}) => {
  const summaryId = useId();
  const totalUploads = data.reduce((sum, point) => sum + point.wallpapers, 0);
  const totalUsers = data.reduce((sum, point) => sum + point.users, 0);
  const hasActivity = data.length > 0 && (totalUploads > 0 || totalUsers > 0);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-1">
          <CardTitle>Uploads and new users</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>

        {/* Non-color legend: lightness swatch + line pattern (solid vs dashed) */}
        <div
          aria-label="Chart legend"
          className="text-caption flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-2">
            <svg
              aria-hidden="true"
              width="24"
              height="8"
              viewBox="0 0 24 8"
              className="shrink-0">
              <line
                x1="0"
                y1="4"
                x2="24"
                y2="4"
                stroke="var(--chart-1)"
                strokeWidth="2.5"
              />
            </svg>
            <span className="text-foreground font-medium">
              Uploads ({formatCount(totalUploads)})
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            <svg
              aria-hidden="true"
              width="24"
              height="8"
              viewBox="0 0 24 8"
              className="shrink-0">
              <line
                x1="0"
                y1="4"
                x2="24"
                y2="4"
                stroke="var(--chart-2)"
                strokeWidth="2.5"
                strokeDasharray="5 4"
              />
            </svg>
            <span className="text-muted-foreground font-medium">
              New users ({formatCount(totalUsers)})
            </span>
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <p
          id={summaryId}
          className="sr-only">
          {`${description}. Total uploads: ${totalUploads}. Total new users: ${totalUsers}.`}
        </p>

        {!hasActivity ?
          <EmptyState
            compact={true}
            icon={BarChart3Icon}
            title="No activity in this window"
            description="No new uploads or user registrations were recorded during this period."
          />
        : <div aria-describedby={summaryId}>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-64">
              <AreaChart
                accessibilityLayer
                data={data}
                margin={{
                  left: 0,
                  right: 12,
                }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={32}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="wallpapers"
                  type="natural"
                  fill="var(--color-wallpapers)"
                  fillOpacity={0.28}
                  stroke="var(--color-wallpapers)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="users"
                  type="natural"
                  fill="var(--color-users)"
                  fillOpacity={0.12}
                  stroke="var(--color-users)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        }
      </CardContent>
    </Card>
  );
};

export default AdminTrendChart;
