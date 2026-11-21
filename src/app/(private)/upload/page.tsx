import { buttonVariants } from "@/components/shadcnui/button";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { createMetadata } from "@/lib/metadata";
import { uploadSearchParamsSchema } from "@/lib/zodSchema";
import { Prisma } from "@generated/prisma/client";
import { UploadIcon } from "lucide-react";
import type { Route } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import UploadCard from "./_components/upload-card";
import UploadEmpty from "./_components/upload-empty";
import UploadPagination from "./_components/upload-pagination";
import UploadStatusTabs from "./_components/upload-status-tabs";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "My uploads",
  description: "Track, edit, and manage the wallpapers you have uploaded",
});

const PAGE_SIZE = 12;

type UploadPageProps = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

const UploadPage = async ({ searchParams }: UploadPageProps) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/");
  }

  const raw = await searchParams;
  const parsed = uploadSearchParamsSchema.safeParse(raw);
  const { status, page: requestedPage } =
    parsed.success ? parsed.data : uploadSearchParamsSchema.parse({});

  const baseWhere = {
    uploaderId: session.user.id,
    thumb400Url: { not: null },
  } satisfies Prisma.WallpaperWhereInput;

  const approvedWhere: Prisma.WallpaperWhereInput = {
    isApproved: true,
  };
  const pendingWhere: Prisma.WallpaperWhereInput = {
    isApproved: false,
    moderationQueue: { status: "PENDING" },
  };
  const rejectedWhere: Prisma.WallpaperWhereInput = {
    moderationQueue: { status: "REJECTED" },
  };

  const [allCount, approvedCount, pendingCount, rejectedCount] =
    await Promise.all([
      prisma.wallpaper.count({ where: baseWhere }),
      prisma.wallpaper.count({
        where: { AND: [baseWhere, approvedWhere] },
      }),
      prisma.wallpaper.count({
        where: { AND: [baseWhere, pendingWhere] },
      }),
      prisma.wallpaper.count({
        where: { AND: [baseWhere, rejectedWhere] },
      }),
    ]);

  const counts = {
    all: allCount,
    approved: approvedCount,
    pending: pendingCount,
    rejected: rejectedCount,
  } as const;

  const filteredCount = counts[status];
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const statusWhere =
    status === "approved" ? approvedWhere
    : status === "pending" ? pendingWhere
    : status === "rejected" ? rejectedWhere
    : null;

  const wallpapers = await prisma.wallpaper.findMany({
    where: statusWhere ? { AND: [baseWhere, statusWhere] } : baseWhere,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      title: true,
      slug: true,
      createdAt: true,
      isApproved: true,
      isPublic: true,
      thumb400Url: true,
      thumb800Url: true,
      originalUrl: true,
      blurDataUrl: true,
      width: true,
      height: true,
      moderationQueue: {
        select: { status: true },
      },
    },
  });

  return (
    <div className="w-full p-6">
      <div className="grid gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              My uploads
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Track, edit, and manage the wallpapers you have shared. Approved
              wallpapers appear in Browse.
            </p>
          </div>
          <Link
            href={"/upload/new" as Route}
            className={buttonVariants()}>
            <UploadIcon data-icon="inline-start" />
            Upload wallpaper
          </Link>
        </div>

        <UploadStatusTabs
          active={status}
          counts={counts}
        />

        {wallpapers.length === 0 ?
          <UploadEmpty filtered={status !== "all"} />
        : <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {wallpapers.map((wallpaper) => (
                <UploadCard
                  key={wallpaper.id}
                  wallpaper={wallpaper}
                />
              ))}
            </div>
            <UploadPagination
              page={page}
              totalPages={totalPages}
              status={status}
            />
          </>
        }
      </div>
    </div>
  );
};

export default UploadPage;
