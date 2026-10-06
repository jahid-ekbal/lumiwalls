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
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
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
import { Textarea } from "@/components/shadcnui/textarea";
import type { ModerationSearchParamsType } from "@/lib/zodSchema";
import {
  bulkReviewWallpapers,
  hardDeleteWallpaper,
  resolveReport,
  reviewWallpaper,
  setBan,
} from "@/server/actions/moderation";
import { Loader2Icon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

type QueueItem = {
  id: string;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewer: { id: string; name: string; email: string } | null;
  wallpaper: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    originalUrl: string | null;
    thumb400Url: string | null;
    thumb800Url: string | null;
    thumb1920Url: string | null;
    isPublic: boolean;
    isApproved: boolean;
    pHash: string | null;
    createdAt: string;
    category: { id: string; name: string; slug: string } | null;
    tags: { id: string; name: string }[];
    uploader: {
      id: string;
      name: string;
      email: string;
      banned: boolean;
      banReason: string | null;
      banExpires: string | null;
    };
  };
};

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
    uploader: { id: string; name: string; email: string; banned: boolean };
  };
};

type Props = {
  params: ModerationSearchParamsType;
  categories: CategoryOption[];
  counts: {
    pending: number;
    approved: number;
    rejected: number;
    pendingReports: number;
  };
  queueTotalPages: number;
  reportTotalPages: number;
  queue: QueueItem[];
  reports: ReportItem[];
};

type NotesFormValues = {
  notes: string;
};

const tabParsers = {
  tab: parseAsStringLiteral(["queue", "reports"] as const)
    .withDefault("queue")
    .withOptions({
      history: "push" as const,
      shallow: false,
      clearOnDefault: true,
      scroll: false,
    }),
  status: parseAsStringLiteral(["PENDING", "APPROVED", "REJECTED"] as const)
    .withDefault("PENDING")
    .withOptions({
      history: "push" as const,
      shallow: false,
      clearOnDefault: true,
      scroll: false,
    }),
  reportStatus: parseAsStringLiteral([
    "PENDING",
    "RESOLVED",
    "DISMISSED",
    "ALL",
  ] as const)
    .withDefault("PENDING")
    .withOptions({
      history: "push" as const,
      shallow: false,
      clearOnDefault: true,
      scroll: false,
    }),
  q: parseAsString.withDefault("").withOptions({
    history: "push" as const,
    shallow: false,
    clearOnDefault: true,
    scroll: false,
  }),
  category: parseAsString.withDefault("all").withOptions({
    history: "push" as const,
    shallow: false,
    clearOnDefault: true,
    scroll: false,
  }),
  sort: parseAsStringLiteral(["newest", "oldest"] as const)
    .withDefault("newest")
    .withOptions({
      history: "push" as const,
      shallow: false,
      clearOnDefault: true,
      scroll: false,
    }),
  page: parseAsInteger.withDefault(1).withOptions({
    history: "push" as const,
    shallow: false,
    clearOnDefault: true,
    scroll: false,
  }),
};

const formatISO = (value: string | null) => {
  if (!value) {
    return "Never";
  }
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const thumbFor = (item: QueueItem) =>
  item.wallpaper.thumb400Url ??
  item.wallpaper.thumb800Url ??
  item.wallpaper.thumb1920Url ??
  item.wallpaper.originalUrl;

const ModerationClient = ({
  params,
  categories,
  counts,
  queueTotalPages,
  reportTotalPages,
  queue,
  reports,
}: Props) => {
  const router = useRouter();
  const [tab, setTab] = useQueryState("tab", tabParsers.tab);
  const [status, setStatus] = useQueryState("status", tabParsers.status);
  const [reportStatus, setReportStatus] = useQueryState(
    "reportStatus",
    tabParsers.reportStatus,
  );
  const [query, setQuery] = useQueryState("q", tabParsers.q);
  const [category, setCategory] = useQueryState(
    "category",
    tabParsers.category,
  );
  const [sort, setSort] = useQueryState("sort", tabParsers.sort);
  const [page, setPage] = useQueryState("page", tabParsers.page);
  const [input, setInput] = useState(query);
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setInput(query);
  }

  useEffect(() => {
    if (input === query) {
      return;
    }
    const timer = setTimeout(() => {
      void setQuery(input.trim() === "" ? "" : input);
      void setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [input, query, setQuery, setPage]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{
    id: string;
    title: string;
    decision: "APPROVED" | "REJECTED";
  } | null>(null);
  const [bulkDecision, setBulkDecision] = useState<
    "APPROVED" | "REJECTED" | null
  >(null);
  const [banTarget, setBanTarget] = useState<{
    userId: string;
    name: string;
    email: string;
    banned: boolean;
  } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banExpiry, setBanExpiry] = useState("permanent");
  const [resolveTarget, setResolveTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [resolveDecision, setResolveDecision] = useState<
    "RESOLVED" | "DISMISSED"
  >("RESOLVED");
  const [hideWallpaper, setHideWallpaper] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [previewItem, setPreviewItem] = useState<QueueItem | null>(null);

  const {
    handleSubmit: handleReviewSubmit,
    control: reviewControl,
    reset: resetReview,
    formState: { isSubmitting: isReviewSubmitting },
  } = useForm<NotesFormValues>({
    defaultValues: { notes: "" },
    mode: "all",
  });

  const {
    handleSubmit: handleBulkSubmit,
    control: bulkControl,
    reset: resetBulk,
    formState: { isSubmitting: isBulkSubmitting },
  } = useForm<NotesFormValues>({
    defaultValues: { notes: "" },
    mode: "all",
  });

  useEffect(() => {
    resetReview({ notes: "" });
  }, [reviewTarget, resetReview]);

  useEffect(() => {
    resetBulk({ notes: "" });
  }, [bulkDecision, resetBulk]);

  const categoryItems = useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...categories.map((item) => ({ value: item.slug, label: item.name })),
    ],
    [categories],
  );

  const sortItems = useMemo(
    () => [
      { value: "newest", label: "Newest" },
      { value: "oldest", label: "Oldest" },
    ],
    [],
  );

  const activeTab = tab ?? params.tab;
  const activeStatus = status ?? params.status;
  const activeReportStatus = reportStatus ?? params.reportStatus;
  const activeCategory = category ?? params.category;
  const activeSort = sort ?? params.sort;
  const activePage = page ?? params.page;

  const toggleSelect = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(queue.map((item) => item.wallpaper.id)));
    } else {
      setSelected(new Set());
    }
  };

  const submitReview = async (values: NotesFormValues) => {
    if (!reviewTarget) {
      return;
    }
    if (reviewTarget.decision === "REJECTED" && !values.notes.trim()) {
      toast.error("Review notes are required to reject");
      return;
    }
    setBusyId(reviewTarget.id);
    const result = await reviewWallpaper({
      wallpaperId: reviewTarget.id,
      decision: reviewTarget.decision,
      reviewNotes: values.notes,
    });
    setBusyId(null);
    if (!result.success) {
      toast.error(
        result.error === "NOTES_REQUIRED" ?
          "Review notes are required"
        : "Review failed",
      );
      return;
    }
    toast.success(
      reviewTarget.decision === "APPROVED" ?
        "Wallpaper approved"
      : "Wallpaper rejected",
    );
    setReviewTarget(null);
    setPreviewItem(null);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(reviewTarget.id);
      return next;
    });
    router.refresh();
  };

  const submitBulk = async (values: NotesFormValues) => {
    if (!bulkDecision || selected.size === 0) {
      return;
    }
    if (bulkDecision === "REJECTED" && !values.notes.trim()) {
      toast.error("A shared note is required to bulk reject");
      return;
    }
    const result = await bulkReviewWallpapers({
      wallpaperIds: [...selected],
      decision: bulkDecision,
      reviewNotes: values.notes,
    });
    if (!result.success) {
      toast.error("Bulk review failed");
      return;
    }
    toast.success(
      `Updated ${result.data?.updated ?? selected.size} wallpapers`,
    );
    setBulkDecision(null);
    setSelected(new Set());
    router.refresh();
  };

  const submitBan = async () => {
    if (!banTarget) {
      return;
    }
    const nextBanned = !banTarget.banned;
    if (nextBanned && !banReason.trim()) {
      toast.error("A ban reason is required");
      return;
    }
    const expires =
      nextBanned && banExpiry !== "permanent" ?
        new Date(Date.now() + Number(banExpiry) * 24 * 60 * 60 * 1000)
      : undefined;
    setBusyId(banTarget.userId);
    const result = await setBan({
      userId: banTarget.userId,
      banned: nextBanned,
      banReason,
      banExpires: expires,
    });
    setBusyId(null);
    if (!result.success) {
      toast.error(
        result.error === "CANNOT_BAN_SELF" ? "You cannot ban yourself"
        : result.error === "CANNOT_BAN_ADMIN" ? "Admins cannot be banned"
        : "Ban update failed",
      );
      return;
    }
    toast.success(nextBanned ? "User banned" : "User unbanned");
    setBanTarget(null);
    setBanReason("");
    setBanExpiry("permanent");
    router.refresh();
  };

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

  const submitDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setBusyId(deleteTarget.id);
    const result = await hardDeleteWallpaper({ wallpaperId: deleteTarget.id });
    setBusyId(null);
    if (!result.success) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Wallpaper permanently deleted");
    setDeleteTarget(null);
    setPreviewItem(null);
    router.refresh();
  };

  const openBan = (user: QueueItem["wallpaper"]["uploader"]) => {
    setBanTarget({
      userId: user.id,
      name: user.name,
      email: user.email,
      banned: user.banned,
    });
    setBanReason("");
    setBanExpiry("permanent");
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Moderation queue</CardTitle>
          <CardDescription>
            {`${counts.pending} pending, ${counts.approved} approved, ${counts.rejected} rejected, ${counts.pendingReports} reports pending`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTab === "queue" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                void setTab("queue");
                void setPage(1);
              }}>
              Queue
            </Button>
            <Button
              variant={activeTab === "reports" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                void setTab("reports");
                void setPage(1);
              }}>
              {`Reports (${counts.pendingReports})`}
            </Button>
          </div>
          {activeTab === "queue" ?
            <div className="flex flex-wrap gap-2">
              {(["PENDING", "APPROVED", "REJECTED"] as const).map((value) => (
                <Button
                  key={value}
                  variant={activeStatus === value ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    void setStatus(value);
                    void setPage(1);
                    setSelected(new Set());
                  }}>
                  {value}
                </Button>
              ))}
            </div>
          : <div className="flex flex-wrap gap-2">
              {(["PENDING", "RESOLVED", "DISMISSED", "ALL"] as const).map(
                (value) => (
                  <Button
                    key={value}
                    variant={
                      activeReportStatus === value ? "secondary" : "ghost"
                    }
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
          }
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Search title or uploader email"
                autoComplete="off"
                aria-label="Search moderation queue"
                className="pl-9"
              />
            </div>
            <Select
              value={activeCategory}
              items={categoryItems}
              onValueChange={(value) => {
                void setCategory(value);
                void setPage(1);
              }}>
              <SelectTrigger
                aria-label="Filter by category"
                className="w-full lg:w-56">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((item) => (
                  <SelectItem
                    key={item.slug}
                    value={item.slug}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={activeSort}
              items={sortItems}
              onValueChange={(value) => {
                void setSort(value as "newest" | "oldest");
                void setPage(1);
              }}>
              <SelectTrigger
                aria-label="Sort queue"
                className="w-full lg:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {activeTab === "queue" && selected.size > 0 ?
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {`${selected.size} selected`}
              </span>
              <Button
                size="sm"
                onClick={() => setBulkDecision("APPROVED")}>
                Bulk approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setBulkDecision("REJECTED")}>
                Bulk reject
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          : null}
        </CardContent>
      </Card>
      {activeTab === "queue" ?
        <Card>
          <CardHeader>
            <CardTitle>Queue items</CardTitle>
            <CardDescription>
              {`Page ${activePage} of ${queueTotalPages}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queue.length === 0 ?
              <Alert>
                <AlertTitle>No items</AlertTitle>
                <AlertDescription>
                  No wallpapers match this filter.
                </AlertDescription>
              </Alert>
            : <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Checkbox
                        checked={
                          selected.size > 0 && selected.size === queue.length
                        }
                        onCheckedChange={(checked) =>
                          toggleAll(checked === true)
                        }
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Wallpaper</TableHead>
                    <TableHead>Uploader</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((item) => {
                    const thumb = thumbFor(item);
                    const busy = busyId === item.wallpaper.id;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(item.wallpaper.id)}
                            onCheckedChange={(checked) =>
                              toggleSelect(item.wallpaper.id, checked === true)
                            }
                            aria-label={`Select ${item.wallpaper.title}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {thumb ?
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={thumb}
                                alt={item.wallpaper.title}
                                className="size-10 shrink-0 rounded-xl object-cover"
                                loading="lazy"
                              />
                            : <div className="bg-muted size-10 shrink-0 rounded-xl" />
                            }
                            <div>
                              <p className="font-medium">
                                {item.wallpaper.title}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {`Queued ${formatISO(item.createdAt)}`}
                              </p>
                              {item.wallpaper.pHash ?
                                <p className="text-muted-foreground text-xs">
                                  {`pHash ${item.wallpaper.pHash.slice(0, 12)}`}
                                </p>
                              : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{item.wallpaper.uploader.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {item.wallpaper.uploader.email}
                            </p>
                            {item.wallpaper.uploader.banned ?
                              <Badge variant="destructive">Banned</Badge>
                            : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1">
                            {item.wallpaper.category ?
                              <Badge variant="secondary">
                                {item.wallpaper.category.name}
                              </Badge>
                            : <span className="text-muted-foreground text-xs">
                                Uncategorized
                              </span>
                            }
                            {item.wallpaper.tags.map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="outline">
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="grid gap-1">
                            <Badge
                              variant={
                                item.status === "PENDING" ? "secondary"
                                : item.status === "APPROVED" ?
                                  "default"
                                : "destructive"
                              }>
                              {item.status}
                            </Badge>
                            {item.reviewer ?
                              <span className="text-muted-foreground text-xs">
                                {`${item.reviewer.email} on ${formatISO(item.reviewedAt)}`}
                              </span>
                            : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => setPreviewItem(item)}>
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                setReviewTarget({
                                  id: item.wallpaper.id,
                                  title: item.wallpaper.title,
                                  decision: "APPROVED",
                                })
                              }>
                              {busy ?
                                <Loader2Icon className="animate-spin" />
                              : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={busy}
                              onClick={() =>
                                setReviewTarget({
                                  id: item.wallpaper.id,
                                  title: item.wallpaper.title,
                                  decision: "REJECTED",
                                })
                              }>
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() => openBan(item.wallpaper.uploader)}>
                              {item.wallpaper.uploader.banned ? "Unban" : "Ban"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() =>
                                setDeleteTarget({
                                  id: item.wallpaper.id,
                                  title: item.wallpaper.title,
                                })
                              }>
                              Delete
                            </Button>
                          </div>
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
                {`Page ${activePage} of ${queueTotalPages}`}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={activePage >= queueTotalPages}
                onClick={() =>
                  void setPage(Math.min(queueTotalPages, activePage + 1))
                }>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      : <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>
              {`Page ${activePage} of ${reportTotalPages}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ?
              <Alert>
                <AlertTitle>No reports</AlertTitle>
                <AlertDescription>
                  No reports match this filter.
                </AlertDescription>
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
                          <Badge
                            variant={
                              report.status === "PENDING" ? "secondary"
                              : report.status === "RESOLVED" ?
                                "default"
                              : "outline"
                            }>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                setResolveTarget({
                                  id: report.id,
                                  title: report.wallpaper.title,
                                })
                              }>
                              Review
                            </Button>
                          </div>
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
                {`Page ${activePage} of ${reportTotalPages}`}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={activePage >= reportTotalPages}
                onClick={() =>
                  void setPage(Math.min(reportTotalPages, activePage + 1))
                }>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      }
      <Dialog
        open={reviewTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReviewTarget(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewTarget?.decision === "APPROVED" ?
                "Approve wallpaper"
              : "Reject wallpaper"}
            </DialogTitle>
            <DialogDescription>
              {reviewTarget ?
                `Decision for ${reviewTarget.title}`
              : "Review wallpaper"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleReviewSubmit(submitReview)}
            noValidate
            className="grid gap-4">
            <Controller
              name="notes"
              control={reviewControl}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Review notes</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={
                      reviewTarget?.decision === "REJECTED" ?
                        "Required reason for rejection"
                      : "Optional note, preserved with duplicate flags"
                    }
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Button
              type="submit"
              disabled={isReviewSubmitting}
              variant={
                reviewTarget?.decision === "REJECTED" ?
                  "destructive"
                : "default"
              }>
              {isReviewSubmitting ?
                <Loader2Icon className="animate-spin" />
              : reviewTarget?.decision === "APPROVED" ?
                "Approve"
              : "Reject"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={bulkDecision !== null}
        onOpenChange={(open) => {
          if (!open) {
            setBulkDecision(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkDecision === "APPROVED" ? "Bulk approve" : "Bulk reject"}
            </DialogTitle>
            <DialogDescription>
              {`Applies to ${selected.size} selected wallpapers`}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleBulkSubmit(submitBulk)}
            noValidate
            className="grid gap-4">
            <Controller
              name="notes"
              control={bulkControl}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Shared note</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={
                      bulkDecision === "REJECTED" ?
                        "Required shared reason"
                      : "Optional shared note"
                    }
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Button
              type="submit"
              disabled={isBulkSubmitting}
              variant={bulkDecision === "REJECTED" ? "destructive" : "default"}>
              {isBulkSubmitting ?
                <Loader2Icon className="animate-spin" />
              : "Apply"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={banTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setBanTarget(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {banTarget?.banned ? "Unban user" : "Ban user"}
            </DialogTitle>
            <DialogDescription>
              {banTarget ?
                `${banTarget.name} (${banTarget.email})`
              : "Update ban"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="ban-reason">Ban reason</FieldLabel>
              <Input
                id="ban-reason"
                value={banReason}
                onChange={(event) => setBanReason(event.target.value)}
                placeholder="Required when banning"
                autoComplete="off"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ban-expiry">Expiry</FieldLabel>
              <Select
                value={banExpiry}
                items={[
                  { value: "permanent", label: "Permanent" },
                  { value: "1", label: "1 day" },
                  { value: "7", label: "7 days" },
                  { value: "30", label: "30 days" },
                ]}
                onValueChange={(value) => setBanExpiry(value)}>
                <SelectTrigger id="ban-expiry">
                  <SelectValue placeholder="Select expiry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Button
              onClick={() => void submitBan()}
              variant={banTarget?.banned ? "outline" : "destructive"}>
              {banTarget?.banned ? "Unban" : "Ban"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
                `Report for ${resolveTarget.title}`
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
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently delete</DialogTitle>
            <DialogDescription>
              {deleteTarget ?
                `Deletes ${deleteTarget.title} plus S3 originals and thumbnails. Use for illegal content only.`
              : "Delete wallpaper"}
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="destructive"
            onClick={() => void submitDelete()}>
            Delete permanently
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={previewItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewItem(null);
          }
        }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {previewItem?.wallpaper.title ?? "Preview"}
            </DialogTitle>
            <DialogDescription>
              {previewItem ?
                `${previewItem.wallpaper.uploader.email} plus metadata`
              : "Wallpaper preview"}
            </DialogDescription>
          </DialogHeader>
          {previewItem ?
            <div className="grid gap-4">
              {thumbFor(previewItem) ?
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbFor(previewItem) as string}
                  alt={previewItem.wallpaper.title}
                  className="max-h-[60vh] w-full rounded-2xl object-contain"
                />
              : null}
              {previewItem.wallpaper.description ?
                <p className="text-muted-foreground text-sm">
                  {previewItem.wallpaper.description}
                </p>
              : null}
              <div className="flex flex-wrap gap-1">
                {previewItem.wallpaper.category ?
                  <Badge variant="secondary">
                    {previewItem.wallpaper.category.name}
                  </Badge>
                : null}
                {previewItem.wallpaper.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline">
                    {tag.name}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  size="sm"
                  onClick={() => {
                    setReviewTarget({
                      id: previewItem.wallpaper.id,
                      title: previewItem.wallpaper.title,
                      decision: "APPROVED",
                    });
                  }}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setReviewTarget({
                      id: previewItem.wallpaper.id,
                      title: previewItem.wallpaper.title,
                      decision: "REJECTED",
                    });
                  }}>
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openBan(previewItem.wallpaper.uploader)}>
                  {previewItem.wallpaper.uploader.banned ? "Unban" : "Ban"}
                </Button>
              </div>
            </div>
          : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModerationClient;
