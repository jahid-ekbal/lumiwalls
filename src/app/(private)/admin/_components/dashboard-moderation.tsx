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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import prisma from "@/lib/database/dbClient";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { formatDate, PREVIEW_TAKE } from "./dashboard-utils";

const DashboardModeration = async () => {
  const pendingQueue = await prisma.moderationQueue.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: PREVIEW_TAKE,
    include: {
      wallpaper: {
        include: {
          uploader: { select: { name: true, email: true } },
          category: { select: { name: true } },
          tags: {
            take: 3,
            include: { tag: { select: { name: true } } },
          },
        },
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Pending moderation</CardTitle>
            <CardDescription>
              Oldest first by queue order, latest {PREVIEW_TAKE} shown
            </CardDescription>
          </div>
          <Link
            href={"/admin/moderation" as Route}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
            })}>
            <span>Open moderation</span>
            <ArrowRightIcon />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {pendingQueue.length === 0 ?
          <p className="text-muted-foreground py-8 text-center text-sm">
            No wallpapers awaiting review.
          </p>
        : <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wallpaper</TableHead>
                <TableHead>Uploader</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingQueue.map((item) => {
                const wallpaper = item.wallpaper;
                const thumb =
                  wallpaper.thumb400Url ??
                  wallpaper.thumb800Url ??
                  wallpaper.originalUrl;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {thumb ?
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={wallpaper.title}
                            className="size-10 shrink-0 rounded-xl object-cover"
                            loading="lazy"
                          />
                        : <div className="bg-muted size-10 shrink-0 rounded-xl" />
                        }
                        <div>
                          <p className="font-medium">{wallpaper.title}</p>
                          <p className="text-muted-foreground text-xs">
                            {formatDate(item.createdAt)} in queue
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{wallpaper.uploader.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {wallpaper.uploader.email} on{" "}
                          {formatDate(wallpaper.createdAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {wallpaper.category ?
                          <Badge variant="secondary">
                            {wallpaper.category.name}
                          </Badge>
                        : <span className="text-muted-foreground text-xs">
                            Uncategorized
                          </span>
                        }
                        {wallpaper.tags.map(({ tag }) => (
                          <Badge
                            key={tag.name}
                            variant="outline">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        }
      </CardContent>
    </Card>
  );
};

export default DashboardModeration;
