import AnalyticsClient from "@/components/Admin/AnalyticsClient";
import prisma from "@/lib/database/dbClient";
import type { AnalyticsSearchParamsType } from "@/lib/zodSchema";
import { buildTrend } from "../../_components/dashboard-utils";

type Props = {
  params: AnalyticsSearchParamsType;
};

const meanHours = (rows: { createdAt: Date; reviewedAt: Date | null }[]) => {
  const done = rows.filter(
    (row): row is { createdAt: Date; reviewedAt: Date } =>
      row.reviewedAt !== null,
  );
  if (done.length === 0) {
    return null;
  }
  const totalMs = done.reduce(
    (sum, row) => sum + (row.reviewedAt.getTime() - row.createdAt.getTime()),
    0,
  );
  return Math.round((totalMs / done.length / 3600000) * 10) / 10;
};

const AnalyticsContent = async ({ params }: Props) => {
  const days = Number(params.range);
  const now = new Date();
  const trendStart = new Date(now);
  trendStart.setUTCDate(now.getUTCDate() - (days - 1));
  trendStart.setUTCHours(0, 0, 0, 0);

  const [
    userCount,
    wallpaperCount,
    queuePending,
    queueApproved,
    queueRejected,
    viewSum,
    downloadSum,
    categoryCount,
    tagCount,
    trendWallpapers,
    trendUsers,
    reportsByStatus,
    reportsByReason,
    queueReviews,
    reportReviews,
    topViews,
    topDownloads,
    topCategories,
    topTags,
    uploaderGroups,
    totalCollections,
    activeCollections,
    placementsActive,
    placementsUpcoming,
    placementsExpired,
    flaggedFeatured,
    flaggedPick,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.wallpaper.count(),
    prisma.moderationQueue.count({ where: { status: "PENDING" } }),
    prisma.moderationQueue.count({ where: { status: "APPROVED" } }),
    prisma.moderationQueue.count({ where: { status: "REJECTED" } }),
    prisma.wallpaper.aggregate({ _sum: { viewCount: true } }),
    prisma.wallpaper.aggregate({ _sum: { downloadCount: true } }),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.wallpaper.findMany({
      where: { createdAt: { gte: trendStart } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: trendStart } },
      select: { createdAt: true },
    }),
    prisma.report.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.report.groupBy({ by: ["reason"], _count: { _all: true } }),
    prisma.moderationQueue.findMany({
      where: { reviewedAt: { not: null } },
      select: { createdAt: true, reviewedAt: true },
    }),
    prisma.report.findMany({
      where: { reviewedAt: { not: null } },
      select: { createdAt: true, reviewedAt: true },
    }),
    prisma.wallpaper.findMany({
      where: { isApproved: true, isPublic: true },
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        thumb400Url: true,
        viewCount: true,
        downloadCount: true,
        uploader: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.wallpaper.findMany({
      where: { isApproved: true, isPublic: true },
      orderBy: [{ downloadCount: "desc" }, { createdAt: "desc" }],
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        thumb400Url: true,
        viewCount: true,
        downloadCount: true,
        uploader: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { wallpapers: { _count: "desc" } },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { wallpapers: true } },
      },
    }),
    prisma.tag.findMany({
      orderBy: { wallpapers: { _count: "desc" } },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { wallpapers: true } },
      },
    }),
    prisma.wallpaper.groupBy({
      by: ["uploaderId"],
      _count: { _all: true },
      _sum: { viewCount: true, downloadCount: true },
    }),
    prisma.collection.count(),
    prisma.collection.count({ where: { active: true } }),
    prisma.featuredPlacement.count({
      where: {
        active: true,
        startAt: { lte: now },
        OR: [{ endAt: null }, { endAt: { gte: now } }],
      },
    }),
    prisma.featuredPlacement.count({
      where: { active: true, startAt: { gt: now } },
    }),
    prisma.featuredPlacement.count({
      where: { OR: [{ active: false }, { endAt: { lt: now } }] },
    }),
    prisma.wallpaper.count({ where: { featured: true } }),
    prisma.wallpaper.count({ where: { editorsPick: true } }),
  ]);

  const trend = buildTrend(
    trendWallpapers.map((row) => row.createdAt),
    trendUsers.map((row) => row.createdAt),
    now,
  );

  const topUploaders = uploaderGroups
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 10);
  const uploaderUsers = await prisma.user.findMany({
    where: { id: { in: topUploaders.map((row) => row.uploaderId) } },
    select: { id: true, name: true, email: true },
  });
  const uploaderById = new Map(uploaderUsers.map((row) => [row.id, row]));

  return (
    <AnalyticsClient
      params={params}
      trend={trend}
      stats={{
        users: userCount,
        wallpapers: wallpaperCount,
        views: viewSum._sum.viewCount ?? 0,
        downloads: downloadSum._sum.downloadCount ?? 0,
        categories: categoryCount,
        tags: tagCount,
        queuePending,
        queueApproved,
        queueRejected,
        queueLatencyHours: meanHours(queueReviews),
        reportLatencyHours: meanHours(reportReviews),
        collections: totalCollections,
        activeCollections,
        placementsActive,
        placementsUpcoming,
        placementsExpired,
        flaggedFeatured,
        flaggedPick,
      }}
      reportsByStatus={reportsByStatus.map((row) => ({
        status: row.status,
        count: row._count._all,
      }))}
      reportsByReason={reportsByReason.map((row) => ({
        reason: row.reason,
        count: row._count._all,
      }))}
      topViews={topViews.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        thumb400Url: item.thumb400Url,
        viewCount: item.viewCount,
        downloadCount: item.downloadCount,
        uploaderEmail: item.uploader.email,
      }))}
      topDownloads={topDownloads.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        thumb400Url: item.thumb400Url,
        viewCount: item.viewCount,
        downloadCount: item.downloadCount,
        uploaderEmail: item.uploader.email,
      }))}
      topCategories={topCategories.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        count: item._count.wallpapers,
      }))}
      topTags={topTags.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        count: item._count.wallpapers,
      }))}
      topUploaders={topUploaders.map((row) => ({
        id: row.uploaderId,
        name: uploaderById.get(row.uploaderId)?.name ?? "Unknown",
        email: uploaderById.get(row.uploaderId)?.email ?? "Unknown",
        wallpapers: row._count._all,
        views: row._sum.viewCount ?? 0,
        downloads: row._sum.downloadCount ?? 0,
      }))}
    />
  );
};

export default AnalyticsContent;
