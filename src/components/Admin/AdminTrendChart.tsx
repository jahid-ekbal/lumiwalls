"use client";

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
    label: "Users",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const AdminTrendChart = ({ data }: { data: TrendPoint[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Uploads and users</CardTitle>
        <CardDescription>Daily totals for the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
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
              fillOpacity={0.4}
              stroke="var(--color-wallpapers)"
            />
            <Area
              dataKey="users"
              type="natural"
              fill="var(--color-users)"
              fillOpacity={0.4}
              stroke="var(--color-users)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default AdminTrendChart;
