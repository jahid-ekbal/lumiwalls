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
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import { Textarea } from "@/components/shadcnui/textarea";
import { slugify } from "@/lib/slugify";
import type {
  CollectionCreateType,
  CollectionsSearchParamsType,
} from "@/lib/zodSchema";
import { collectionCreateSchema } from "@/lib/zodSchema";
import {
  createCollection,
  deleteCollection,
  updateCollection,
} from "@/server/actions/collections";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, SearchIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";

type CollectionRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  itemCount: number;
  curator: { id: string; name: string; email: string } | null;
};

type Props = {
  params: CollectionsSearchParamsType;
  counts: { total: number; active: number };
  totalPages: number;
  collections: CollectionRow[];
};

const queryOptions = {
  history: "push" as const,
  shallow: false,
  clearOnDefault: true,
  scroll: false,
};

const CollectionsClient = ({
  params,
  counts,
  totalPages,
  collections,
}: Props) => {
  const router = useRouter();
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringLiteral(["all", "active", "hidden"] as const)
      .withDefault("all")
      .withOptions(queryOptions),
  );
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(["newest", "manual"] as const)
      .withDefault("manual")
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CollectionRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const form = useForm<CollectionCreateType>({
    resolver: zodResolver(collectionCreateSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      active: true,
      sortOrder: 0,
    },
    mode: "all",
  });
  const watchedTitle = useWatch({ control: form.control, name: "title" });

  useEffect(() => {
    if (!dialogOpen || editing) {
      return;
    }
    form.setValue("slug", slugify(watchedTitle ?? ""), {
      shouldValidate: true,
    });
  }, [watchedTitle, dialogOpen, editing, form]);

  const openCreate = () => {
    form.reset({
      title: "",
      slug: "",
      description: "",
      active: true,
      sortOrder: 0,
    });
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (row: CollectionRow) => {
    form.reset({
      title: row.title,
      slug: row.slug,
      description: row.description ?? "",
      active: row.active,
      sortOrder: row.sortOrder,
    });
    setEditing(row);
    setDialogOpen(true);
  };

  const submitForm = async (values: CollectionCreateType) => {
    const result =
      editing ?
        await updateCollection({ ...values, id: editing.id })
      : await createCollection(values);
    if (!result.success) {
      toast.error(
        result.error === "SLUG_EXISTS" ? "Slug already exists" : "Save failed",
      );
      return;
    }
    toast.success(editing ? "Collection updated" : "Collection created");
    setDialogOpen(false);
    setEditing(null);
    router.refresh();
  };

  const submitDelete = async () => {
    if (!deleteId) {
      return;
    }
    setBusyId(deleteId);
    const result = await deleteCollection({ id: deleteId });
    setBusyId(null);
    if (!result.success) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Collection deleted, wallpapers kept");
    setDeleteId(null);
    router.refresh();
  };

  const activeStatus = status ?? params.status;
  const activeSort = sort ?? params.sort;
  const activePage = page ?? params.page;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Editorial collections</CardTitle>
          <CardDescription>
            {`${counts.total} total, ${counts.active} active`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Search title or description"
                autoComplete="off"
                aria-label="Search collections"
                className="pl-9"
              />
            </div>
            <Select
              value={activeStatus}
              items={[
                { value: "all", label: "All statuses" },
                { value: "active", label: "Active" },
                { value: "hidden", label: "Hidden" },
              ]}
              onValueChange={(value) => {
                void setStatus(value as "all" | "active" | "hidden");
                void setPage(1);
              }}>
              <SelectTrigger
                aria-label="Filter by status"
                className="w-full lg:w-48">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={activeSort}
              items={[
                { value: "manual", label: "Manual order" },
                { value: "newest", label: "Newest" },
              ]}
              onValueChange={(value) => {
                void setSort(value as "newest" | "manual");
                void setPage(1);
              }}>
              <SelectTrigger
                aria-label="Sort collections"
                className="w-full lg:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual order</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openCreate}>New collection</Button>
          </div>
        </CardContent>
      </Card>
      {collections.length === 0 ?
        <Alert>
          <AlertTitle>No collections</AlertTitle>
          <AlertDescription>No collections match this filter.</AlertDescription>
        </Alert>
      : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {collections.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-1">
                  <Badge variant={item.active ? "default" : "secondary"}>
                    {item.active ? "Active" : "Hidden"}
                  </Badge>
                  <Badge variant="outline">{`${item.itemCount} items`}</Badge>
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.slug}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {item.coverUrl ?
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    className="aspect-video w-full rounded-2xl object-cover"
                    loading="lazy"
                  />
                : <div className="bg-muted aspect-video w-full rounded-2xl" />}
                {item.description ?
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {item.description}
                  </p>
                : null}
                <div className="flex flex-wrap gap-1">
                  <Link
                    href={`/admin/collections/${item.id}` as Route}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-4xl border px-3 text-sm font-medium transition">
                    Manage items
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === item.id}
                    onClick={() => setDeleteId(item.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }
      <div className="flex items-center justify-between">
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
          onClick={() => void setPage(Math.min(totalPages, activePage + 1))}>
          Next
        </Button>
      </div>
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            setEditing(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit collection" : "New collection"}
            </DialogTitle>
            <DialogDescription>
              Admin-curated set for a later public release
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(submitForm)}
            noValidate
            className="grid gap-4">
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="slug"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="sortOrder"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Sort order</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      inputMode="numeric"
                      aria-invalid={fieldState.invalid}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="active"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Visibility</FieldLabel>
                    <Select
                      value={field.value ? "active" : "hidden"}
                      items={[
                        { value: "active", label: "Active" },
                        { value: "hidden", label: "Hidden" },
                      ]}
                      onValueChange={(value) =>
                        field.onChange(value === "active")
                      }>
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="hidden">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </div>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ?
                <Loader2Icon className="animate-spin" />
              : editing ?
                "Save"
              : "Create"}
            </Button>
          </form>
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
            <DialogTitle>Delete collection</DialogTitle>
            <DialogDescription>
              Removes the set and its ordering. Wallpapers are kept.
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="destructive"
            onClick={() => void submitDelete()}>
            Delete collection
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionsClient;
