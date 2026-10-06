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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";
import { Field, FieldLabel } from "@/components/shadcnui/field";
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
import type { FeaturedSearchParamsType } from "@/lib/zodSchema";
import { setWallpaperFlags } from "@/server/actions/collections";
import {
  createPlacement,
  deletePlacement,
  expirePlacement,
  updatePlacement,
} from "@/server/actions/featured";
import { Loader2Icon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type FlagRow = {
  id: string;
  title: string;
  slug: string;
  thumb400Url: string | null;
  featured: boolean;
  editorsPick: boolean;
  uploader: { id: string; name: string; email: string };
};

type PlacementRow = {
  id: string;
  placement: string;
  startAt: string;
  endAt: string | null;
  priority: number;
  active: boolean;
  createdAt: string;
  curator: { id: string; name: string; email: string } | null;
  wallpaper: {
    id: string;
    title: string;
    slug: string;
    thumb400Url: string | null;
    isPublic: boolean;
    isApproved: boolean;
    uploader: { id: string; name: string; email: string };
  };
};

type Props = {
  params: FeaturedSearchParamsType;
  counts: { flags: number; placements: number };
  flagTotalPages: number;
  placementTotalPages: number;
  flags: FlagRow[];
  placements: PlacementRow[];
};

const queryOptions = {
  history: "push" as const,
  shallow: false,
  clearOnDefault: true,
  scroll: false,
};

const toInputValue = (iso: string) => {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const FeaturedClient = ({
  params,
  counts,
  flagTotalPages,
  placementTotalPages,
  flags,
  placements,
}: Props) => {
  const router = useRouter();
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(["flags", "placements"] as const)
      .withDefault("flags")
      .withOptions(queryOptions),
  );
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [flag, setFlag] = useQueryState(
    "flag",
    parseAsStringLiteral(["all", "featured", "pick", "both"] as const)
      .withDefault("all")
      .withOptions(queryOptions),
  );
  const [placement, setPlacement] = useQueryState(
    "placement",
    parseAsStringLiteral(["ALL", "HERO", "TRENDING", "SEASONAL"] as const)
      .withDefault("ALL")
      .withOptions(queryOptions),
  );
  const [windowFilter, setWindowFilter] = useQueryState(
    "window",
    parseAsStringLiteral(["active", "upcoming", "expired", "all"] as const)
      .withDefault("active")
      .withOptions(queryOptions),
  );
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(["newest", "priority"] as const)
      .withDefault("priority")
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
  const [placementOpen, setPlacementOpen] = useState(false);
  const [editing, setEditing] = useState<PlacementRow | null>(null);
  const [wallpaperId, setWallpaperId] = useState("");
  const [placementValue, setPlacementValue] = useState("HERO");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [priority, setPriority] = useState("0");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const submitDelete = async () => {
    if (!deleteId) {
      return;
    }
    setBusyId(deleteId);
    const result = await deletePlacement({ id: deleteId });
    setBusyId(null);
    if (!result.success) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Placement deleted");
    setDeleteId(null);
    router.refresh();
  };

  const activeTab = tab ?? params.tab;
  const activeFlag = flag ?? params.flag;
  const activePlacement = placement ?? params.placement;
  const activeWindow = windowFilter ?? params.window;
  const activePage = page ?? params.page;

  const toggleFlag = async (
    wallpaperId: string,
    field: "featured" | "editorsPick",
    current: { featured: boolean; editorsPick: boolean },
  ) => {
    setBusyId(wallpaperId);
    const result = await setWallpaperFlags({
      wallpaperId,
      featured: field === "featured" ? !current.featured : current.featured,
      editorsPick:
        field === "editorsPick" ? !current.editorsPick : current.editorsPick,
    });
    setBusyId(null);
    if (!result.success) {
      toast.error("Flag update failed");
      return;
    }
    toast.success("Flags updated");
    router.refresh();
  };

  const openCreate = () => {
    setEditing(null);
    setWallpaperId("");
    setPlacementValue("HERO");
    setStartAt(toInputValue(new Date().toISOString()));
    setEndAt("");
    setPriority("0");
    setPlacementOpen(true);
  };

  const submitPlacement = async () => {
    const payload = {
      wallpaperId: wallpaperId.trim(),
      placement: placementValue as "HERO" | "TRENDING" | "SEASONAL",
      startAt: startAt ? new Date(startAt) : new Date(),
      endAt: endAt ? new Date(endAt) : undefined,
      priority: Number(priority) || 0,
      active: true,
    };
    const result =
      editing ?
        await updatePlacement({ ...payload, id: editing.id })
      : await createPlacement(payload);
    if (!result.success) {
      toast.error(
        result.error === "INVALID_RANGE" ? "End must be after start"
        : result.error === "NOT_AVAILABLE" ?
          "Only approved public wallpapers qualify"
        : "Save failed",
      );
      return;
    }
    toast.success(
      editing ?
        "Placement updated, flags linked"
      : "Placement created, flags linked",
    );
    setPlacementOpen(false);
    setEditing(null);
    router.refresh();
  };

  const submitExpire = async (id: string) => {
    setBusyId(id);
    const result = await expirePlacement({ id });
    setBusyId(null);
    if (!result.success) {
      toast.error("Expire failed");
      return;
    }
    toast.success("Placement expired");
    router.refresh();
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Featured curation</CardTitle>
          <CardDescription>
            {`${counts.flags} flagged, ${counts.placements} placements`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTab === "flags" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                void setTab("flags");
                void setPage(1);
              }}>
              Flags
            </Button>
            <Button
              variant={activeTab === "placements" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                void setTab("placements");
                void setPage(1);
              }}>
              Placements
            </Button>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Search title or uploader"
                autoComplete="off"
                aria-label="Search featured"
                className="pl-9"
              />
            </div>
            {activeTab === "flags" ?
              <Select
                value={activeFlag}
                items={[
                  { value: "all", label: "All flags" },
                  { value: "featured", label: "Featured" },
                  { value: "pick", label: "Editor picks" },
                  { value: "both", label: "Both flags" },
                ]}
                onValueChange={(value) => {
                  void setFlag(value as typeof activeFlag);
                  void setPage(1);
                }}>
                <SelectTrigger
                  aria-label="Filter by flag"
                  className="w-full lg:w-48">
                  <SelectValue placeholder="All flags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All flags</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="pick">Editor picks</SelectItem>
                  <SelectItem value="both">Both flags</SelectItem>
                </SelectContent>
              </Select>
            : <>
                <Select
                  value={activePlacement}
                  items={[
                    { value: "ALL", label: "All placements" },
                    { value: "HERO", label: "Hero" },
                    { value: "TRENDING", label: "Trending" },
                    { value: "SEASONAL", label: "Seasonal" },
                  ]}
                  onValueChange={(value) => {
                    void setPlacement(value as typeof activePlacement);
                    void setPage(1);
                  }}>
                  <SelectTrigger
                    aria-label="Filter by placement"
                    className="w-full lg:w-48">
                    <SelectValue placeholder="All placements" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All placements</SelectItem>
                    <SelectItem value="HERO">Hero</SelectItem>
                    <SelectItem value="TRENDING">Trending</SelectItem>
                    <SelectItem value="SEASONAL">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={activeWindow}
                  items={[
                    { value: "active", label: "Active" },
                    { value: "upcoming", label: "Upcoming" },
                    { value: "expired", label: "Expired" },
                    { value: "all", label: "All windows" },
                  ]}
                  onValueChange={(value) => {
                    void setWindowFilter(value as typeof activeWindow);
                    void setPage(1);
                  }}>
                  <SelectTrigger
                    aria-label="Filter by window"
                    className="w-full lg:w-48">
                    <SelectValue placeholder="Window" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="all">All windows</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
            {activeTab === "placements" ?
              <>
                <Select
                  value={sort ?? params.sort}
                  items={[
                    { value: "priority", label: "Priority" },
                    { value: "newest", label: "Newest" },
                  ]}
                  onValueChange={(value) => {
                    void setSort(value as "newest" | "priority");
                    void setPage(1);
                  }}>
                  <SelectTrigger aria-label="Sort placements">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={openCreate}>New placement</Button>
              </>
            : null}
          </div>
        </CardContent>
      </Card>
      {activeTab === "flags" ?
        <Card>
          <CardHeader>
            <CardTitle>Flagged wallpapers</CardTitle>
            <CardDescription>
              {`Page ${activePage} of ${flagTotalPages}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {flags.length === 0 ?
              <Alert>
                <AlertTitle>No flags</AlertTitle>
                <AlertDescription>
                  No wallpapers match this filter.
                </AlertDescription>
              </Alert>
            : <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wallpaper</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flags.map((item) => {
                    const busy = busyId === item.id;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.thumb400Url ?
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.thumb400Url}
                                alt={item.title}
                                className="size-10 shrink-0 rounded-xl object-cover"
                                loading="lazy"
                              />
                            : <div className="bg-muted size-10 shrink-0 rounded-xl" />
                            }
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-muted-foreground text-xs">
                                {item.uploader.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge
                              variant={item.featured ? "default" : "outline"}>
                              Featured
                            </Badge>
                            <Badge
                              variant={
                                item.editorsPick ? "default" : "outline"
                              }>
                              Pick
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                void toggleFlag(item.id, "featured", {
                                  featured: item.featured,
                                  editorsPick: item.editorsPick,
                                })
                              }>
                              {busy ?
                                <Loader2Icon className="animate-spin" />
                              : item.featured ?
                                "Unfeature"
                              : "Feature"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() =>
                                void toggleFlag(item.id, "editorsPick", {
                                  featured: item.featured,
                                  editorsPick: item.editorsPick,
                                })
                              }>
                              {busy ?
                                <Loader2Icon className="animate-spin" />
                              : item.editorsPick ?
                                "Unpick"
                              : "Pick"}
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
                {`Page ${activePage} of ${flagTotalPages}`}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={activePage >= flagTotalPages}
                onClick={() =>
                  void setPage(Math.min(flagTotalPages, activePage + 1))
                }>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      : <Card>
          <CardHeader>
            <CardTitle>Scheduled placements</CardTitle>
            <CardDescription>
              {`Page ${activePage} of ${placementTotalPages}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {placements.length === 0 ?
              <Alert>
                <AlertTitle>No placements</AlertTitle>
                <AlertDescription>
                  No placements match this filter.
                </AlertDescription>
              </Alert>
            : <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wallpaper</TableHead>
                    <TableHead>Window</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {placements.map((item) => {
                    const busy = busyId === item.id;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.wallpaper.thumb400Url ?
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.wallpaper.thumb400Url}
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
                                {`${item.wallpaper.slug} plus ${item.wallpaper.uploader.email}`}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="grid gap-1">
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="secondary">
                                {item.placement}
                              </Badge>
                              <Badge
                                variant={item.active ? "default" : "outline"}>
                                {item.active ? "Active" : "Inactive"}
                              </Badge>
                              <Badge variant="outline">
                                {`P${item.priority}`}
                              </Badge>
                            </div>
                            <span className="text-muted-foreground text-xs">
                              {`${new Date(item.startAt).toLocaleDateString()} to ${item.endAt ? new Date(item.endAt).toLocaleDateString() : "open"}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => {
                                setEditing(item);
                                setWallpaperId(item.wallpaper.id);
                                setPlacementValue(item.placement);
                                setStartAt(toInputValue(item.startAt));
                                setEndAt(
                                  item.endAt ? toInputValue(item.endAt) : "",
                                );
                                setPriority(String(item.priority));
                                setPlacementOpen(true);
                              }}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() => void submitExpire(item.id)}>
                              Expire
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() => setDeleteId(item.id)}>
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
                {`Page ${activePage} of ${placementTotalPages}`}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={activePage >= placementTotalPages}
                onClick={() =>
                  void setPage(Math.min(placementTotalPages, activePage + 1))
                }>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      }
      <Dialog
        open={placementOpen}
        onOpenChange={(open) => {
          if (!open) {
            setPlacementOpen(false);
            setEditing(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit placement" : "New placement"}
            </DialogTitle>
            <DialogDescription>
              Hero and seasonal link featured, trending links editor pick
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="placement-wallpaper">
                Wallpaper ID or slug
              </FieldLabel>
              <Input
                id="placement-wallpaper"
                value={wallpaperId}
                onChange={(event) => setWallpaperId(event.target.value)}
                placeholder="Wallpaper cuid or slug"
                autoComplete="off"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="placement-kind">Placement</FieldLabel>
                <Select
                  value={placementValue}
                  items={[
                    { value: "HERO", label: "Hero" },
                    { value: "TRENDING", label: "Trending" },
                    { value: "SEASONAL", label: "Seasonal" },
                  ]}
                  onValueChange={(value) => setPlacementValue(value)}>
                  <SelectTrigger id="placement-kind">
                    <SelectValue placeholder="Placement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HERO">Hero</SelectItem>
                    <SelectItem value="TRENDING">Trending</SelectItem>
                    <SelectItem value="SEASONAL">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="placement-priority">Priority</FieldLabel>
                <Input
                  id="placement-priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="placement-start">Start</FieldLabel>
                <Input
                  id="placement-start"
                  type="datetime-local"
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="placement-end">End optional</FieldLabel>
                <Input
                  id="placement-end"
                  type="datetime-local"
                  value={endAt}
                  onChange={(event) => setEndAt(event.target.value)}
                />
              </Field>
            </div>
            <Button onClick={() => void submitPlacement()}>
              {editing ? "Save placement" : "Create placement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete placement</DialogTitle>
            <DialogDescription>
              Flags clear only when no same-kind placement remains.
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="destructive"
            onClick={() => void submitDelete()}>
            Delete placement
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeaturedClient;
