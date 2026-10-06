"use client";

import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import AdminTrendChart from "@/components/Admin/AdminTrendChart";
import type { AnalyticsSearchParamsType } from "@/lib/zodSchema";
import type { Route } from "next";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { parseAsStringLiteral } from "nuqs";

type TrendPoint = {
  date: string;
  label: string;
  wallpapers: number;
  users: number;
};

type TopWallpaper = {
  id: string;
  title: string;
  slug: string;
  thumb400Url: string | null;
  viewCount: number;
  downloadCount: number;
  uploaderEmail: string;
};

type NamedCount = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

type TopUploader = {
  id: string;
  name: string;
  email: string;
  wallpapers: number;
  views: number;
  downloads: number;
};

type Props = {
  params: AnalyticsSearchParamsType;
  trend: TrendPoint[];
  stats: {
    users: number;
    wallpapers: number;
    views: number;
    downloads: number;
    categories: number;
    tags: number;
    queuePending: number;
    queueApproved: number;
    queueRejected: number;
    queueLatencyHours: number | null;
    reportLatencyHours: number | null;
    collections: number;
    activeCollections: number;
    placementsActive: number;
    placementsUpcoming: number;
    placementsExpired: number;
    flaggedFeatured: number;
    flaggedPick: number;
  };
  reportsByStatus: { status: string; count: number }[];
  reportsByReason: { reason: string; count: number }[];
  topViews: TopWallpaper[];
  topDownloads: TopWallpaper[];
  topCategories: NamedCount[];
  topTags: NamedCount[];
  topUploaders: TopUploader[];
};

const downloadCSV = (
  filename: string,
  header: string[],
  rows: (string | number)[][],
) => {
  const escape = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [header, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const AnalyticsClient = ({
  params,
  trend,
  stats,
  reportsByStatus,
  reportsByReason,
  topViews,
  topDownloads,
  topCategories,
  topTags,
  topUploaders,
}: Props) => {
  const [range, setRange] = useQueryState(
    "range",
    parseAsStringLiteral(["7", "30", "90"] as const)
      .withDefault("30")
      .withOptions({
        history: "push" as const,
        shallow: false,
        clearOnDefault: true,
        scroll: false,
      }),
  );
  const activeRange = range ?? params.range;

  const latency = (value: number | null) =>
    value === null ? "No reviews yet" : `${value}h avg`;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Platform overview</CardTitle>
              <CardDescription>
                {`Last ${activeRange} days trend, all-time totals`}
              </CardDescription>
            </div>
            <Select
              value={activeRange}
              items={[
                { value: "7", label: "Last 7 days" },
                { value: "30", label: "Last 30 days" },
                { value: "90", label: "Last 90 days" },
              ]}
              onValueChange={(value) => {
                void setRange(value as "7" | "30" | "90");
              }}>
              <SelectTrigger aria-label="Trend range">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <AdminTrendChart
            data={trend}
            description={`Daily totals for the last ${activeRange} days`}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {[
              { label: "Users", value: stats.users },
              { label: "Wallpapers", value: stats.wallpapers },
              { label: "Lifetime views", value: stats.views },
              { label: "Lifetime downloads", value: stats.downloads },
              { label: "Categories", value: stats.categories },
              { label: "Tags", value: stats.tags },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-muted rounded-2xl p-3">
                <p className="text-muted-foreground text-xs">{item.label}</p>
                <p className="text-xl font-semibold">
                  {item.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Top by views</CardTitle>
                <CardDescription>
                  Top 10 approved public wallpapers
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadCSV(
                    "top-views.csv",
                    ["title", "slug", "uploader", "views", "downloads"],
                    topViews.map((item) => [
                      item.title,
                      item.slug,
                      item.uploaderEmail,
                      item.viewCount,
                      item.downloadCount,
                    ]),
                  )
                }>
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallpaper</TableHead>
                  <TableHead>Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topViews.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.uploaderEmail}
                      </p>
                    </TableCell>
                    <TableCell>{item.viewCount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Top by downloads</CardTitle>
                <CardDescription>
                  Top 10 approved public wallpapers
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadCSV(
                    "top-downloads.csv",
                    ["title", "slug", "uploader", "views", "downloads"],
                    topDownloads.map((item) => [
                      item.title,
                      item.slug,
                      item.uploaderEmail,
                      item.viewCount,
                      item.downloadCount,
                    ]),
                  )
                }>
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallpaper</TableHead>
                  <TableHead>Downloads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDownloads.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.uploaderEmail}
                      </p>
                    </TableCell>
                    <TableCell>{item.downloadCount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Top categories</CardTitle>
                <CardDescription>By wallpaper count</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadCSV(
                    "top-categories.csv",
                    ["name", "slug", "wallpapers"],
                    topCategories.map((item) => [
                      item.name,
                      item.slug,
                      item.count,
                    ]),
                  )
                }>
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Wallpapers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCategories.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Top tags</CardTitle>
                <CardDescription>By wallpaper count</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadCSV(
                    "top-tags.csv",
                    ["name", "slug", "wallpapers"],
                    topTags.map((item) => [item.name, item.slug, item.count]),
                  )
                }>
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Wallpapers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topTags.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Top uploaders</CardTitle>
              <CardDescription>Top 10 by wallpaper count</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                downloadCSV(
                  "top-uploaders.csv",
                  ["name", "email", "wallpapers", "views", "downloads"],
                  topUploaders.map((item) => [
                    item.name,
                    item.email,
                    item.wallpapers,
                    item.views,
                    item.downloads,
                  ]),
                )
              }>
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Uploader</TableHead>
                <TableHead>Wallpapers</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Downloads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topUploaders.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.email}
                    </p>
                  </TableCell>
                  <TableCell>{item.wallpapers}</TableCell>
                  <TableCell>{item.views.toLocaleString()}</TableCell>
                  <TableCell>{item.downloads.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Moderation health</CardTitle>
            <CardDescription>Queue funnel plus review latency</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary">{`${stats.queuePending} pending`}</Badge>
              <Badge variant="default">{`${stats.queueApproved} approved`}</Badge>
              <Badge variant="destructive">{`${stats.queueRejected} rejected`}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {`Queue latency: ${latency(stats.queueLatencyHours)}`}
            </p>
            <p className="text-muted-foreground text-sm">
              {`Report latency: ${latency(stats.reportLatencyHours)}`}
            </p>
            <div className="flex flex-wrap gap-1">
              {reportsByStatus.map((row) => (
                <Badge
                  key={row.status}
                  variant="outline">
                  {`${row.status}: ${row.count}`}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {reportsByReason.map((row) => (
                <Badge
                  key={row.reason}
                  variant="outline">
                  {`${row.reason}: ${row.count}`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Curation snapshot</CardTitle>
            <CardDescription>Collections, placements, flags</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              {`${stats.activeCollections} of ${stats.collections} collections active`}
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary">{`${stats.placementsActive} placements active`}</Badge>
              <Badge variant="outline">{`${stats.placementsUpcoming} upcoming`}</Badge>
              <Badge variant="outline">{`${stats.placementsExpired} expired`}</Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="default">{`${stats.flaggedFeatured} featured`}</Badge>
              <Badge variant="outline">{`${stats.flaggedPick} picks`}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={"/admin/collections" as Route}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-4xl border px-3 text-sm font-medium transition">
                Collections
              </Link>
              <Link
                href={"/admin/featured" as Route}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-4xl border px-3 text-sm font-medium transition">
                Featured
              </Link>
              <Link
                href={"/admin/moderation" as Route}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-4xl border px-3 text-sm font-medium transition">
                Moderation
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsClient;
