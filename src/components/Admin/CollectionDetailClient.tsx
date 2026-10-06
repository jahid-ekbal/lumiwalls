"use client";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import { Textarea } from "@/components/shadcnui/textarea";
import {
  addCollectionItem,
  removeCollectionItem,
  reorderCollectionItems,
  setCollectionCover,
  setWallpaperFlags,
} from "@/server/actions/collections";
import { ArrowDownIcon, ArrowUpIcon, Loader2Icon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

type DetailCollection = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  active: boolean;
  sortOrder: number;
  curator: { id: string; name: string; email: string } | null;
};

type DetailItem = {
  wallpaperId: string;
  position: number;
  note: string | null;
  wallpaper: {
    id: string;
    title: string;
    slug: string;
    thumb400Url: string | null;
    isPublic: boolean;
    isApproved: boolean;
    featured: boolean;
    editorsPick: boolean;
    uploader: { id: string; name: string; email: string };
  };
};

type Props = {
  collection: DetailCollection;
  items: DetailItem[];
};

const CollectionDetailClient = ({ collection, items }: Props) => {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [wallpaperSlug, setWallpaperSlug] = useState("");
  const [note, setNote] = useState("");

  const orderedIds = items.map((item) => item.wallpaperId);

  const moveItem = async (wallpaperId: string, direction: -1 | 1) => {
    const index = orderedIds.indexOf(wallpaperId);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= orderedIds.length) {
      return;
    }
    const next = [...orderedIds];
    [next[index], next[target]] = [next[target], next[index]];
    setBusyId(wallpaperId);
    const result = await reorderCollectionItems({
      collectionId: collection.id,
      wallpaperIds: next,
    });
    setBusyId(null);
    if (!result.success) {
      toast.error("Reorder failed");
      return;
    }
    toast.success("Order updated");
    router.refresh();
  };

  const submitAdd = async () => {
    const slug = wallpaperSlug.trim();
    if (!slug) {
      toast.error("Enter a wallpaper ID");
      return;
    }
    setBusyId("add");
    const result = await addCollectionItem({
      collectionId: collection.id,
      wallpaperId: slug,
      note,
    });
    setBusyId(null);
    if (!result.success) {
      toast.error(
        result.error === "ALREADY_ADDED" ?
          "Wallpaper already in this collection"
        : result.error === "NOT_AVAILABLE" ?
          "Only approved public wallpapers can be added"
        : "Add failed, use the wallpaper ID from browse",
      );
      return;
    }
    toast.success("Wallpaper added");
    setAddOpen(false);
    setWallpaperSlug("");
    setNote("");
    router.refresh();
  };

  const submitRemove = async (wallpaperId: string) => {
    setBusyId(wallpaperId);
    const result = await removeCollectionItem({
      collectionId: collection.id,
      wallpaperId,
    });
    setBusyId(null);
    if (!result.success) {
      toast.error("Remove failed");
      return;
    }
    toast.success("Wallpaper removed");
    router.refresh();
  };

  const submitCover = async (wallpaperId: string) => {
    setBusyId(wallpaperId);
    const result = await setCollectionCover({
      collectionId: collection.id,
      wallpaperId,
    });
    setBusyId(null);
    if (!result.success) {
      toast.error("Cover update failed");
      return;
    }
    toast.success("Cover updated");
    router.refresh();
  };

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
      toast.error(
        result.error === "NOT_AVAILABLE" ?
          "Only approved public wallpapers can be featured"
        : "Flag update failed",
      );
      return;
    }
    toast.success("Flags updated");
    router.refresh();
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Link
          href={"/admin/collections" as Route}
          className="text-muted-foreground text-sm">
          Back to collections
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {collection.title}
        </h1>
        <p className="text-muted-foreground text-sm">
          {`${collection.slug} plus ${items.length} items`}
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant={collection.active ? "default" : "secondary"}>
              {collection.active ? "Active" : "Hidden"}
            </Badge>
            <Badge variant="outline">{`Order ${collection.sortOrder}`}</Badge>
          </div>
          <CardTitle>Ordered items</CardTitle>
          <CardDescription>Approved public wallpapers only</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}>
              Add wallpaper
            </Button>
          </div>
          {items.length === 0 ?
            <p className="text-muted-foreground py-8 text-center text-sm">
              No wallpapers yet. Add by wallpaper ID from browse.
            </p>
          : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallpaper</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const busy = busyId === item.wallpaperId;
                  return (
                    <TableRow key={item.wallpaperId}>
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
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant={
                              item.wallpaper.featured ? "default" : "outline"
                            }>
                            Featured
                          </Badge>
                          <Badge
                            variant={
                              item.wallpaper.editorsPick ? "default" : "outline"
                            }>
                            Pick
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            aria-label={`Move ${item.wallpaper.title} up`}
                            onClick={() => void moveItem(item.wallpaperId, -1)}>
                            <ArrowUpIcon className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            aria-label={`Move ${item.wallpaper.title} down`}
                            onClick={() => void moveItem(item.wallpaperId, 1)}>
                            <ArrowDownIcon className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              void toggleFlag(item.wallpaperId, "featured", {
                                featured: item.wallpaper.featured,
                                editorsPick: item.wallpaper.editorsPick,
                              })
                            }>
                            {item.wallpaper.featured ? "Unfeature" : "Feature"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() =>
                              void toggleFlag(item.wallpaperId, "editorsPick", {
                                featured: item.wallpaper.featured,
                                editorsPick: item.wallpaper.editorsPick,
                              })
                            }>
                            {item.wallpaper.editorsPick ? "Unpick" : "Pick"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => void submitCover(item.wallpaperId)}>
                            Cover
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => void submitRemove(item.wallpaperId)}>
                            {busy ?
                              <Loader2Icon className="animate-spin" />
                            : "Remove"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          }
        </CardContent>
      </Card>
      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddOpen(false);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add wallpaper</DialogTitle>
            <DialogDescription>
              Use the wallpaper ID from browse. Only approved public wallpapers
              qualify.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="collection-wallpaper">
                Wallpaper ID
              </FieldLabel>
              <Input
                id="collection-wallpaper"
                value={wallpaperSlug}
                onChange={(event) => setWallpaperSlug(event.target.value)}
                placeholder="Wallpaper cuid"
                autoComplete="off"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="collection-note">Note</FieldLabel>
              <Textarea
                id="collection-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional curator note"
              />
            </Field>
            <Button
              onClick={() => void submitAdd()}
              disabled={busyId === "add"}>
              Add to collection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionDetailClient;
