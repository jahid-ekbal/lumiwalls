"use client";

import { Badge } from "@/components/shadcnui/badge";
import { buttonVariants } from "@/components/shadcnui/button";
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
import { UploadIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export type UploadTrendPoint = {
  date: string;
  label: string;
  uploads: number;
};

const chartConfig = {
  uploads: {
    label: "Uploads",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const UserUploadsTrendChart = ({ data }: { data: UploadTrendPoint[] }) => {
  const windowTotal = data.reduce((sum, point) => sum + point.uploads, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Upload activity</CardTitle>
            <CardDescription>
              Daily uploads for the last 30 days
            </CardDescription>
          </div>
          <Badge variant="secondary">Last 30 days</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {windowTotal === 0 && (
          <div className="bg-muted mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
            <p className="text-muted-foreground text-sm">
              No uploads in the last 30 days.
            </p>
            <Link
              href={"/upload" as Route}
              className={buttonVariants({ size: "sm" })}>
              <UploadIcon />
              <span>Upload wallpaper</span>
            </Link>
          </div>
        )}
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
            <defs>
              <linearGradient
                id="uploadsWash"
                x1="0"
                y1="0"
                x2="0"
                y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-uploads)"
                  stopOpacity={0.5}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-uploads)"
                  stopOpacity={0.03}
                />
              </linearGradient>
            </defs>
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
              dataKey="uploads"
              type="natural"
              fill="url(#uploadsWash)"
              stroke="var(--color-uploads)"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default UserUploadsTrendChart;
