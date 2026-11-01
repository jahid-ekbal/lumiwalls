import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import prisma from "@/lib/database/dbClient";

const formatBytes = (bytes: number) => {
  if (bytes === 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 || value >= 10 ? 0 : 1)} ${
    units[exponent]
  }`;
};

const DashboardStorage = async () => {
  const [sizeAggregate, approvedCount, hiddenCount, formatGroups] =
    await Promise.all([
      prisma.wallpaper.aggregate({ _sum: { fileSize: true } }),
      prisma.wallpaper.count({ where: { isApproved: true } }),
      prisma.wallpaper.count({ where: { isPublic: false } }),
      prisma.wallpaper.groupBy({ by: ["format"], _count: { _all: true } }),
    ]);

  const totalBytes = sizeAggregate._sum.fileSize ?? 0;
  const totalCount = formatGroups.reduce(
    (sum, group) => sum + group._count._all,
    0,
  );
  const pendingApproval = totalCount - approvedCount;

  const formatGroupsSorted = [...formatGroups].sort(
    (a, b) => b._count._all - a._count._all,
  );

  const chips = [
    {
      label: "Total storage",
      value: formatBytes(totalBytes),
    },
    {
      label: "Approval split",
      value:
        totalCount === 0 ? "Nothing yet" : (
          `${approvedCount} approved, ${pendingApproval} awaiting`
        ),
    },
    {
      label: "Not public",
      value: `${hiddenCount} private to uploader`,
    },
    {
      label: "Formats",
      value:
        formatGroupsSorted.length === 0 ?
          "None yet"
        : formatGroupsSorted
            .map(
              (group) => `${group.format ?? "unknown"} x${group._count._all}`,
            )
            .join(", "),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage</CardTitle>
        <CardDescription>
          Library footprint by filesize, approval state, and file format
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {chips.map((chip) => (
            <div
              key={chip.label}
              className="bg-muted/40 grid min-w-44 gap-1 rounded-2xl border px-4 py-3">
              <p className="text-muted-foreground text-xs">{chip.label}</p>
              <p className="text-xl font-semibold tracking-tight">
                {chip.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardStorage;
