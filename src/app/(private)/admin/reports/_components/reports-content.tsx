import ReportsClient from "@/components/Admin/ReportsClient";
import prisma from "@/lib/database/dbClient";
import type { ReportsSearchParamsType } from "@/lib/zodSchema";
import type { Prisma } from "@generated/prisma/client";

const PAGE_SIZE = 12;

type Props = {
  params: ReportsSearchParamsType;
};

const ReportsContent = async ({ params }: Props) => {
  const query = params.q.trim();
  const sortDirection = params.sort === "oldest" ? "asc" : "desc";

  const clauses: Prisma.ReportWhereInput[] = [];
  if (params.reportStatus !== "ALL") {
    clauses.push({ status: params.reportStatus });
  }
  if (params.reason !== "ALL") {
    clauses.push({ reason: params.reason });
  }
  if (query !== "") {
    clauses.push({
      OR: [
        { wallpaper: { title: { contains: query, mode: "insensitive" } } },
        { reporter: { email: { contains: query, mode: "insensitive" } } },
        { reporter: { name: { contains: query, mode: "insensitive" } } },
      ],
    });
  }
  const where: Prisma.ReportWhereInput =
    clauses.length === 0 ? {}
    : clauses.length === 1 ? clauses[0]
    : { AND: clauses };

  const [total, pendingCount, rows] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.report.findMany({
      where,
      orderBy: { createdAt: sortDirection },
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
        wallpaper: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            uploader: {
              select: { id: true, name: true, email: true, banned: true },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <ReportsClient
      params={params}
      counts={{ total, pending: pendingCount }}
      totalPages={totalPages}
      reports={rows.map((item) => ({
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
          category: item.wallpaper.category,
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

export default ReportsContent;
