import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { formatBytes } from "@/lib/format";
import {
  FolderHeartIcon,
  HardDriveIcon,
  RatioIcon,
  TagIcon,
} from "lucide-react";
import { headers } from "next/headers";

const DashboardStorage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

  const [aggregate, categoryRows, tagRows] = await Promise.all([
    prisma.wallpaper.aggregate({
      where: { uploaderId: session.user.id },
      _sum: { fileSize: true },
      _avg: { width: true, height: true },
      _count: { _all: true },
    }),
    prisma.wallpaper.groupBy({
      by: ["categoryId"],
      where: { uploaderId: session.user.id },
      _count: { _all: true },
    }),
    prisma.wallpaperTag.groupBy({
      by: ["tagId"],
      where: { wallpaper: { uploaderId: session.user.id } },
      _count: { _all: true },
    }),
  ]);

  const topCategoryRow = categoryRows
    .filter((row) => row.categoryId !== null)
    .sort((a, b) => b._count._all - a._count._all)[0];
  const topTagRow = tagRows.sort((a, b) => b._count._all - a._count._all)[0];
  const topCategoryId = topCategoryRow?.categoryId ?? null;
  const topTagId = topTagRow?.tagId ?? null;
  const [topCategory, topTag] = await Promise.all([
    topCategoryId ?
      prisma.category.findUnique({
        where: { id: topCategoryId },
        select: { name: true },
      })
    : null,
    topTagId ?
      prisma.tag.findUnique({ where: { id: topTagId }, select: { name: true } })
    : null,
  ]);

  const totalSize = aggregate._sum.fileSize ?? 0;
  const avgWidth = aggregate._avg.width;
  const avgHeight = aggregate._avg.height;
  const hasWallpapers = (aggregate._count._all ?? 0) > 0;
  const averageResolution =
    avgWidth !== null && avgHeight !== null ?
      `${Math.round(avgWidth)} x ${Math.round(avgHeight)}`
    : null;

  const rows = [
    {
      icon: HardDriveIcon,
      label: "Total storage",
      value: hasWallpapers ? formatBytes(totalSize) : null,
      hint: `Across ${aggregate._count._all ?? 0} wallpaper${(aggregate._count._all ?? 0) === 1 ? "" : "s"}`,
    },
    {
      icon: RatioIcon,
      label: "Average resolution",
      value: averageResolution,
      hint: "Mean width and height of your originals",
    },
    {
      icon: FolderHeartIcon,
      label: "Most used category",
      value: topCategory?.name ?? null,
      hint: "Category your uploads land in most",
    },
    {
      icon: TagIcon,
      label: "Most used tag",
      value: topTag?.name ?? null,
      hint: "Tag you apply most to your uploads",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage insights</CardTitle>
        <CardDescription>
          Disk footprint and usage patterns of your wallpapers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="bg-muted/40 flex items-center gap-3 rounded-xl p-3">
              <span className="bg-card text-muted-foreground ring-foreground/5 flex size-9 shrink-0 items-center justify-center rounded-lg ring-1">
                <row.icon className="size-4" />
              </span>
              <span className="grid min-w-0 gap-0.5">
                <span className="text-caption text-muted-foreground tracking-wide uppercase">
                  {row.label}
                </span>
                <span className="text-body-sm truncate font-medium">
                  {row.value ?? "Nothing yet"}
                </span>
                <span className="text-caption text-muted-foreground truncate">
                  {row.hint}
                </span>
              </span>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
};

export default DashboardStorage;
