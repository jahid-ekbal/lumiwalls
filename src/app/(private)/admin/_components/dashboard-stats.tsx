import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import prisma from "@/lib/database/dbClient";
import {
  DownloadIcon,
  EyeIcon,
  HourglassIcon,
  ImagesIcon,
  TagsIcon,
  UsersIcon,
} from "lucide-react";

const DashboardStats = async () => {
  const [
    totalUsers,
    totalWallpapers,
    pendingCount,
    viewAggregate,
    downloadAggregate,
    categoryCount,
    tagCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.wallpaper.count(),
    prisma.moderationQueue.count({ where: { status: "PENDING" } }),
    prisma.wallpaper.aggregate({ _sum: { viewCount: true } }),
    prisma.wallpaper.aggregate({ _sum: { downloadCount: true } }),
    prisma.category.count(),
    prisma.tag.count(),
  ]);

  const stats = [
    {
      title: "Total users",
      value: totalUsers.toLocaleString(),
      description: "Registered accounts",
      icon: UsersIcon,
    },
    {
      title: "Total wallpapers",
      value: totalWallpapers.toLocaleString(),
      description: "Uploaded wallpapers",
      icon: ImagesIcon,
    },
    {
      title: "Pending moderation",
      value: pendingCount.toLocaleString(),
      description: "Awaiting review",
      icon: HourglassIcon,
    },
    {
      title: "Lifetime views",
      value: (viewAggregate._sum.viewCount ?? 0).toLocaleString(),
      description: "Sum of wallpaper views",
      icon: EyeIcon,
    },
    {
      title: "Lifetime downloads",
      value: (downloadAggregate._sum.downloadCount ?? 0).toLocaleString(),
      description: "Sum of wallpaper downloads",
      icon: DownloadIcon,
    },
    {
      title: "Taxonomy",
      value: (categoryCount + tagCount).toLocaleString(),
      description: `${categoryCount} categories, ${tagCount} tags`,
      icon: TagsIcon,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{stat.title}</CardTitle>
              <stat.icon className="text-muted-foreground size-4" />
            </div>
            <CardDescription>{stat.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
