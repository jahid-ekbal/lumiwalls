import { Badge } from "@/components/shadcnui/badge";
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
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { FlagIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import type { Route } from "next";

const REPORTS_TAKE = 3;

const reportStatusBadge = (status: "PENDING" | "RESOLVED" | "DISMISSED") => {
  switch (status) {
    case "PENDING":
      return { label: "Pending", variant: "secondary" as const };
    case "RESOLVED":
      return { label: "Resolved", variant: "default" as const };
    case "DISMISSED":
      return { label: "Dismissed", variant: "outline" as const };
  }
};

const DashboardReports = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

  const [totalReports, latest] = await Promise.all([
    prisma.report.count({ where: { reporterId: session.user.id } }),
    prisma.report.findMany({
      where: { reporterId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: REPORTS_TAKE,
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
        wallpaper: { select: { title: true, slug: true } },
      },
    }),
  ]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>My reports</CardTitle>
          <Badge variant="outline">{totalReports} total</Badge>
        </div>
        <CardDescription>
          The wallpaper flags you filed and where they stand
        </CardDescription>
      </CardHeader>
      <CardContent>
        {latest.length === 0 ?
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <FlagIcon className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              You have not reported a wallpaper yet.
            </p>
          </div>
        : <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wallpaper</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Filed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latest.map((report) => {
                const status = reportStatusBadge(report.status);
                return (
                  <TableRow key={report.id}>
                    <TableCell className="max-w-40">
                      <Link
                        href={preview(report.wallpaper.slug)}
                        className="block truncate font-medium hover:underline">
                        {report.wallpaper.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground lowercase">
                      {report.reason.toLowerCase()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      <time
                        suppressHydrationWarning={true}
                        dateTime={report.createdAt.toISOString()}
                        title={formatDistanceToNow(report.createdAt, {
                          addSuffix: true,
                        })}>
                        {format(report.createdAt, "MMM d, yyyy")}
                      </time>
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

const preview = (slug: string) => `/browse?preview=${slug}` as Route;

export default DashboardReports;
