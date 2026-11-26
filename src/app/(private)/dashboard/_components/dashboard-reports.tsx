import StatusBadge from "@/components/UI/StatusBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { getActiveSession } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { formatDistanceToNow } from "date-fns";
import { ShieldCheckIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ModerationStatus } from "./dashboard-utils";

const REASON_LABELS: Record<string, string> = {
  SPAM: "Spam",
  NSFW: "NSFW content",
  COPYRIGHT: "Copyright",
  LOW_QUALITY: "Low quality",
  OTHER: "Other",
};

const REPORT_STATUS_MAP: Record<string, ModerationStatus> = {
  OPEN: "OPEN",
  REVIEWED: "REVIEWED",
  DISMISSED: "DISMISSED",
};

const DashboardReports = async () => {
  const session = await getActiveSession();

  if (!session?.user) {
    return null;
  }

  const reports = await prisma.report.findMany({
    where: { reporterId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      reason: true,
      status: true,
      createdAt: true,
      wallpaper: {
        select: {
          title: true,
          slug: true,
          isApproved: true,
          isPublic: true,
        },
      },
    },
  });

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Your reports</CardTitle>
        <CardDescription>
          Flags you submitted and their review state
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {reports.length === 0 ?
          <div className="flex items-center gap-3 py-4">
            <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full">
              <ShieldCheckIcon
                aria-hidden="true"
                className="size-4"
              />
            </span>
            <p className="text-body-sm text-muted-foreground">
              You have not filed any reports. Help keep the gallery clean from
              the Browse viewer.
            </p>
          </div>
        : <ul className="grid gap-2">
            {reports.map((report) => {
              const isViewable =
                report.wallpaper.isApproved && report.wallpaper.isPublic;
              return (
                <li
                  key={report.id}
                  className="bg-muted/30 flex items-center justify-between gap-3 rounded-xl px-3 py-2">
                  <div className="min-w-0 flex-1">
                    {isViewable ?
                      <Link
                        href={
                          `/browse?preview=${report.wallpaper.slug}` as Route
                        }
                        className="text-body-sm block truncate font-medium hover:underline">
                        {report.wallpaper.title}
                      </Link>
                    : <span className="text-body-sm block truncate font-medium">
                        {report.wallpaper.title}
                      </span>
                    }
                    <p className="text-caption text-muted-foreground truncate">
                      {REASON_LABELS[report.reason] ?? report.reason} &middot;{" "}
                      {formatDistanceToNow(report.createdAt, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <StatusBadge
                    status={REPORT_STATUS_MAP[report.status] ?? "OPEN"}
                    className="shrink-0"
                  />
                </li>
              );
            })}
          </ul>
        }
      </CardContent>
    </Card>
  );
};

export default DashboardReports;
