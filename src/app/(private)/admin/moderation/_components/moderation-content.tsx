import prisma from "@/lib/database/dbClient";
import type { ModerationSearchParamsType } from "@/lib/zodSchema";
import type { Prisma } from "@generated/prisma/client";
import ModerationClient from "@/components/Admin/ModerationClient";

const PAGE_SIZE = 12;

type Props = {
  params: ModerationSearchParamsType;
};

const ModerationContent = async ({ params }: Props) => {
  const query = params.q.trim();
  const sortDirection = params.sort === "oldest" ? "asc" : "desc";

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  const knownSlugs = new Set(categories.map((item) => item.slug));
  const categorySlug =
    params.category === "all" || !knownSlugs.has(params.category) ?
      "all"
    : params.category;

  const queueClauses: Prisma.ModerationQueueWhereInput[] = [
    { status: params.status },
  ];
  if (query !== "") {
    queueClauses.push({
      wallpaper: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { uploader: { email: { contains: query, mode: "insensitive" } } },
          { uploader: { name: { contains: query, mode: "insensitive" } } },
        ],
      },
    });
  }
  if (categorySlug !== "all") {
    queueClauses.push({ wallpaper: { category: { slug: categorySlug } } });
  }
  const queueWhere: Prisma.ModerationQueueWhereInput =
    queueClauses.length === 1 ? queueClauses[0] : { AND: queueClauses };

  const reportClauses: Prisma.ReportWhereInput[] = [];
  if (params.reportStatus !== "ALL") {
    reportClauses.push({ status: params.reportStatus });
  }
  if (query !== "") {
    reportClauses.push({
      OR: [
        { wallpaper: { title: { contains: query, mode: "insensitive" } } },
        { reporter: { email: { contains: query, mode: "insensitive" } } },
      ],
    });
  }
  const reportWhere: Prisma.ReportWhereInput =
    reportClauses.length === 0 ? {}
    : reportClauses.length === 1 ? reportClauses[0]
    : { AND: reportClauses };

  const [
    queueTotal,
    reportTotal,
    pendingCount,
    approvedCount,
    rejectedCount,
    pendingReportsCount,
    queueRows,
    reportRows,
  ] = await Promise.all([
    prisma.moderationQueue.count({ where: queueWhere }),
    prisma.report.count({ where: reportWhere }),
    prisma.moderationQueue.count({ where: { status: "PENDING" } }),
    prisma.moderationQueue.count({ where: { status: "APPROVED" } }),
    prisma.moderationQueue.count({ where: { status: "REJECTED" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.moderationQueue.findMany({
      where: queueWhere,
      orderBy: { createdAt: sortDirection },
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
        wallpaper: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true,
                banned: true,
                banReason: true,
                banExpires: true,
              },
            },
            category: { select: { id: true, name: true, slug: true } },
            tags: {
              take: 5,
              include: { tag: { select: { id: true, name: true } } },
            },
          },
        },
      },
    }),
    prisma.report.findMany({
      where: reportWhere,
      orderBy: { createdAt: sortDirection },
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
        wallpaper: {
          include: {
            uploader: {
              select: { id: true, name: true, email: true, banned: true },
            },
          },
        },
      },
    }),
  ]);

  const queueTotalPages = Math.max(1, Math.ceil(queueTotal / PAGE_SIZE));
  const reportTotalPages = Math.max(1, Math.ceil(reportTotal / PAGE_SIZE));

  return (
    <ModerationClient
      params={params}
      categories={categories}
      counts={{
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        pendingReports: pendingReportsCount,
      }}
      queueTotalPages={queueTotalPages}
      reportTotalPages={reportTotalPages}
      queue={queueRows.map((item) => ({
        id: item.id,
        status: item.status,
        reviewNotes: item.reviewNotes,
        createdAt: item.createdAt.toISOString(),
        reviewedAt: item.reviewedAt?.toISOString() ?? null,
        reviewer:
          item.reviewer ?
            {
              id: item.reviewer.id,
              name: item.reviewer.name,
              email: item.reviewer.email,
            }
          : null,
        wallpaper: {
          id: item.wallpaper.id,
          title: item.wallpaper.title,
          slug: item.wallpaper.slug,
          description: item.wallpaper.description,
          originalUrl: item.wallpaper.originalUrl,
          thumb400Url: item.wallpaper.thumb400Url,
          thumb800Url: item.wallpaper.thumb800Url,
          thumb1920Url: item.wallpaper.thumb1920Url,
          isPublic: item.wallpaper.isPublic,
          isApproved: item.wallpaper.isApproved,
          pHash: item.wallpaper.pHash,
          createdAt: item.wallpaper.createdAt.toISOString(),
          category: item.wallpaper.category,
          tags: item.wallpaper.tags.map(({ tag }) => tag),
          uploader: {
            id: item.wallpaper.uploader.id,
            name: item.wallpaper.uploader.name,
            email: item.wallpaper.uploader.email,
            banned: item.wallpaper.uploader.banned ?? false,
            banReason: item.wallpaper.uploader.banReason,
            banExpires:
              item.wallpaper.uploader.banExpires?.toISOString() ?? null,
          },
        },
      }))}
      reports={reportRows.map((item) => ({
        id: item.id,
        reason: item.reason,
        details: item.details,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        reviewedAt: item.reviewedAt?.toISOString() ?? null,
        reporter:
          item.reporter ?
            {
              id: item.reporter.id,
              name: item.reporter.name,
              email: item.reporter.email,
            }
          : null,
        reviewer:
          item.reviewer ?
            {
              id: item.reviewer.id,
              name: item.reviewer.name,
              email: item.reviewer.email,
            }
          : null,
        wallpaper: {
          id: item.wallpaper.id,
          title: item.wallpaper.title,
          slug: item.wallpaper.slug,
          thumb400Url: item.wallpaper.thumb400Url,
          thumb800Url: item.wallpaper.thumb800Url,
          isPublic: item.wallpaper.isPublic,
          isApproved: item.wallpaper.isApproved,
          uploader: {
            id: item.wallpaper.uploader.id,
            name: item.wallpaper.uploader.name,
            email: item.wallpaper.uploader.email,
            banned: item.wallpaper.uploader.banned ?? false,
          },
        },
      }))}
    />
  );
};

export default ModerationContent;
