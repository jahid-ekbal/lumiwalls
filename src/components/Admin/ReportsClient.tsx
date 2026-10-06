"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/shadcnui/alert";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { Checkbox } from "@/components/shadcnui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";
import { Input } from "@/components/shadcnui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import type { ReportsSearchParamsType } from "@/lib/zodSchema";
import { resolveReport } from "@/server/actions/moderation";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

type ReportItem = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  reporter: { id: string; name: string; email: string } | null;
  reviewer: { id: string; name: string; email: string } | null;
  wallpaper: {
    id: string;
    title: string;
    slug: string;
    thumb400Url: string | null;
    thumb800Url: string | null;
    isPublic: boolean;
    isApproved: boolean;
    category: { id: string; name: string; slug: string } | null;
    uploader: { id: string; name: string; email: string; banned: boolean };
  };
};

type Props = {
  params: ReportsSearchParamsType;
  counts: { total: number; pending: number };
  totalPages: number;
  reports: ReportItem[];
};

const queryOptions = {
  history: "push" as const,
  shallow: false,
  clearOnDefault: true,
  scroll: false,
};

const reasonOptions = [
  "SPAM",
  "NUDITY",
  "COPYRIGHT",
  "VIOLENCE",
  "OTHER",
] as const;

const ReportsClient = ({ params, counts, totalPages, reports }: Props) => {
  const router = useRouter();
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [reason, setReason] = useQueryState(
    "reason",
    parseAsStringLiteral(["ALL", ...reasonOptions] as const)
      .withDefault("ALL")
      .withOptions(queryOptions),
  );
  const [reportStatus, setReportStatus] = useQueryState(
    "reportStatus",
    parseAsStringLiteral(["PENDING", "RESOLVED", "DISMISSED", "ALL"] as const)
      .withDefault("PENDING")
      .withOptions(queryOptions),
  );
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(["newest", "oldest"] as const)
      .withDefault("newest")
      .withOptions(queryOptions),
  );
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions(queryOptions),
  );
  const [input, setInput] = useState(query ?? "");
  const [prevQuery, setPrevQuery] = useState(query ?? "");
  if ((query ?? "") !== prevQuery) {
    setPrevQuery(query ?? "");
    setInput(query ?? "");
  }

  useEffect(() => {
    if (input === (query ?? "")) {
      return;
    }
    const timer = setTimeout(() => {
      void setQuery(input.trim() === "" ? "" : input);
      void setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [input, query, setQuery, setPage]);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [resolveTarget, setResolveTarget] = useState<ReportItem | null>(null);
  const [resolveDecision, setResolveDecision] = useState<
    "RESOLVED" | "DISMISSED"
  >("RESOLVED");
  const [hideWallpaper, setHideWallpaper] = useState(false);

  const activeReason = reason ?? params.reason;
  const activeStatus = reportStatus ?? params.reportStatus;
  const activeSort = sort ?? params.sort;
  const activePage = page ?? params.page;

  const reasonItems = useMemo(
    () => [
      { value: "ALL", label: "All reasons" },
      ...reasonOptions.map((value) => ({ value, label: value })),
    ],
    [],
  );

  const submitResolve = async () => {
    if (!resolveTarget) {
      return;
    }
    setBusyId(resolveTarget.id);
    const result = await resolveReport({
      reportId: resolveTarget.id,
      decision: resolveDecision,
      hideWallpaper,
    });
    setBusyId(null);
    if (!result.success) {
      toast.error("Report update failed");
      return;
    }
    toast.success(
      resolveDecision === "RESOLVED" ? "Report resolved" : "Report dismissed",
    );
    setResolveTarget(null);
    setHideWallpaper(false);
    router.refresh();
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>
            {`${counts.pending} pending, ${counts.total} matching filters`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {(["PENDING", "RESOLVED", "DISMISSED", "ALL"] as const).map(
              (value) => (
                <Button
                  key={value}
                  variant={activeStatus === value ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    void setReportStatus(value);
                    void setPage(1);
                  }}>
                  {value}
                </Button>
              ),
            )}
          </div>
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Search title or reporter"
                autoComplete="off"
                aria-label="Search reports"
                className="pl-9"
              />
            </div>
            <Select
              value={activeReason}
              items={reasonItems}
              onValueChange={(value) => {
                void setReason(value as typeof activeReason);
                void setPage(1);
              }}>
              <SelectTrigger
                aria-label="Filter by reason"
                className="w-full lg:w-48">
                <SelectValue placeholder="All reasons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All reasons</SelectItem>
                {reasonOptions.map((value) => (
                  <SelectItem
                    key={value}
                    value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={activeSort}
              items={[
                { value: "newest", label: "Newest" },
                { value: "oldest", label: "Oldest" },
              ]}
              onValueChange={(value) => {
                void setSort(value as "newest" | "oldest");
                void setPage(1);
              }}>
              <SelectTrigger
                aria-label="Sort reports"
                className="w-full lg:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Report rows</CardTitle>
          <CardDescription>
            {`Page ${activePage} of ${totalPages}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ?
            <Alert>
              <AlertTitle>No reports</AlertTitle>
              <AlertDescription>No reports match this filter.</AlertDescription>
            </Alert>
          : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallpaper</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const thumb =
                    report.wallpaper.thumb400Url ??
                    report.wallpaper.thumb800Url;
                  const busy = busyId === report.id;
                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {thumb ?
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt={report.wallpaper.title}
                              className="size-10 shrink-0 rounded-xl object-cover"
                              loading="lazy"
                            />
                          : <div className="bg-muted size-10 shrink-0 rounded-xl" />
                          }
                          <div>
                            <p className="font-medium">
                              {report.wallpaper.title}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {`${report.wallpaper.uploader.email}${report.wallpaper.isPublic ? "" : " (hidden)"}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p>{report.reporter?.name ?? "Anonymous"}</p>
                        <p className="text-muted-foreground text-xs">
                          {report.reporter?.email ?? "No account"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="grid gap-1">
                          <Badge variant="outline">{report.reason}</Badge>
                          {report.details ?
                            <span className="text-muted-foreground text-xs">
                              {report.details}
                            </span>
                          : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="grid gap-1">
                          <Badge
                            variant={
                              report.status === "PENDING" ? "secondary"
                              : report.status === "RESOLVED" ?
                                "default"
                              : "outline"
                            }>
                            {report.status}
                          </Badge>
                          {report.reviewer ?
                            <span className="text-muted-foreground text-xs">
                              {report.reviewer.email}
                            </span>
                          : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => {
                            setResolveTarget(report);
                            setResolveDecision("RESOLVED");
                            setHideWallpaper(false);
                          }}>
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          }
          <div className="mt-4 flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              disabled={activePage <= 1}
              onClick={() => void setPage(Math.max(1, activePage - 1))}>
              Previous
            </Button>
            <span className="text-muted-foreground text-sm">
              {`Page ${activePage} of ${totalPages}`}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={activePage >= totalPages}
              onClick={() =>
                void setPage(Math.min(totalPages, activePage + 1))
              }>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={resolveTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setResolveTarget(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve report</DialogTitle>
            <DialogDescription>
              {resolveTarget ?
                `Report for ${resolveTarget.wallpaper.title}`
              : "Update report"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Select
              value={resolveDecision}
              items={[
                { value: "RESOLVED", label: "Resolved" },
                { value: "DISMISSED", label: "Dismissed" },
              ]}
              onValueChange={(value) =>
                setResolveDecision(value as "RESOLVED" | "DISMISSED")
              }>
              <SelectTrigger aria-label="Report decision">
                <SelectValue placeholder="Select decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="DISMISSED">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={hideWallpaper}
                onCheckedChange={(checked) =>
                  setHideWallpaper(checked === true)
                }
              />
              Hide wallpaper from browse (sets isPublic false)
            </label>
            <Button onClick={() => void submitResolve()}>Apply</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsClient;
