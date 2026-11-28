"use client";

import EmptyState from "@/components/UI/EmptyState";
import Pagination from "@/components/UI/Pagination";
import { Badge } from "@/components/shadcnui/badge";
import { Button, buttonVariants } from "@/components/shadcnui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { Switch } from "@/components/shadcnui/switch";
import { Textarea } from "@/components/shadcnui/textarea";
import { formatPluralCount, formatRelativeDate } from "@/lib/format";
import { toImagePath } from "@/lib/imageUrl";
import {
  personalBoardCreateSchema,
  type PersonalBoardCreateType,
} from "@/lib/zodSchema";
import { createPersonalBoard } from "@/server/actions/boards";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckIcon,
  FolderHeartIcon,
  FolderPlusIcon,
  GlobeIcon,
  Loader2Icon,
  LockIcon,
  SearchIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

export type DirectoryCollectionCard = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  isCurated: boolean;
  isPublicToMembers: boolean;
  itemCount: number;
  updatedAt: string;
  authorName: string | null;
  authorHandle: string | null;
};

const tabParser = parseAsStringLiteral(["curated", "mine"] as const)
  .withDefault("curated")
  .withOptions({ shallow: false, clearOnDefault: true });
const qParser = parseAsString
  .withDefault("")
  .withOptions({ shallow: false, clearOnDefault: true });
const pageParser = parseAsInteger
  .withDefault(1)
  .withOptions({ shallow: false, clearOnDefault: true });

const CollectionsDirectoryClient = ({
  tab,
  q,
  page,
  totalPages,
  curatedCount,
  mineCount,
  collections,
}: {
  tab: "curated" | "mine";
  q: string;
  page: number;
  totalPages: number;
  curatedCount: number;
  mineCount: number;
  collections: DirectoryCollectionCard[];
}) => {
  const router = useRouter();
  const [, setTab] = useQueryState("tab", tabParser);
  const [, setQ] = useQueryState("q", qParser);
  const [, setPage] = useQueryState("page", pageParser);
  const [searchInput, setSearchInput] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  const [createOpen, setCreateOpen] = useState(false);

  if (q !== lastQ) {
    setLastQ(q);
    setSearchInput(q);
  }

  useEffect(() => {
    if (searchInput === q) return;
    const timer = setTimeout(() => {
      void setQ(searchInput.trim() === "" ? "" : searchInput.trim());
      void setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [q, searchInput, setPage, setQ]);

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<PersonalBoardCreateType>({
    resolver: zodResolver(personalBoardCreateSchema),
    defaultValues: { title: "", description: "", isPublicToMembers: true },
    mode: "onTouched",
  });

  const handleCreate = async (values: PersonalBoardCreateType) => {
    const result = await createPersonalBoard(values);
    if (!result.success) {
      toast.error(
        result.error === "BOARD_LIMIT_REACHED" ?
          "You have reached the 40-board limit"
        : "Could not create board",
      );
      return;
    }
    toast.success(`Board "${result.data.title}" created`);
    reset();
    setCreateOpen(false);
    void setTab("mine");
    router.refresh();
  };

  return (
    <div className="grid w-full gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="border-border/60 bg-card/50 rounded-control flex w-fit flex-wrap gap-1 border p-1">
          <Button
            type="button"
            size="sm"
            variant={tab === "curated" ? "default" : "ghost"}
            onClick={() => {
              void setTab("curated");
              void setPage(1);
            }}>
            <SparklesIcon data-icon="inline-start" />
            Curated sets ({curatedCount})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tab === "mine" ? "default" : "ghost"}
            onClick={() => {
              void setTab("mine");
              void setPage(1);
            }}>
            <FolderHeartIcon data-icon="inline-start" />
            My personal boards ({mineCount})
          </Button>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <div className="relative min-w-56 flex-1 sm:max-w-xs">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search collections or boards"
              aria-label="Search collections or boards"
              className="rounded-full pr-8 pl-9"
            />
            {searchInput ?
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Clear search"
                onClick={() => {
                  setSearchInput("");
                  void setQ("");
                }}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full">
                <XIcon aria-hidden="true" />
              </Button>
            : null}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setCreateOpen(true)}>
            <FolderPlusIcon data-icon="inline-start" />
            New board
          </Button>
        </div>
      </div>

      {collections.length === 0 ?
        <EmptyState
          icon={FolderHeartIcon}
          title={
            tab === "mine" ?
              "No personal boards yet"
            : "No curated collections match"
          }
          description={
            tab === "mine" ?
              "Create a personal board to group wallpapers by setup, mood, or resolution."
            : "Try clearing the search query or switch to your personal boards."
          }
          action={
            tab === "mine" ?
              <Button
                type="button"
                size="sm"
                onClick={() => setCreateOpen(true)}>
                <FolderPlusIcon data-icon="inline-start" />
                Create your first board
              </Button>
            : <Link
                href={"/browse" as Route}
                className={buttonVariants({ variant: "outline", size: "sm" })}>
                <SparklesIcon data-icon="inline-start" />
                Explore gallery
              </Link>
          }
        />
      : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {collections.map((collection) => {
            const coverSrc = toImagePath(collection.coverUrl);
            return (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}` as Route}
                className="group border-border/70 bg-card hover:border-foreground/30 rounded-inset flex h-full flex-col overflow-hidden border transition-colors">
                <div className="bg-muted/40 relative aspect-16/9 w-full overflow-hidden">
                  {coverSrc ?
                    <Image
                      src={coverSrc}
                      alt={collection.title}
                      fill={true}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="duration-base object-cover transition-transform motion-safe:group-hover:scale-[1.03]"
                    />
                  : <div className="flex size-full items-center justify-center">
                      <FolderHeartIcon className="text-muted-foreground size-7" />
                    </div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute right-2.5 bottom-2 left-2.5 flex items-center justify-between gap-2">
                    <Badge className="bg-neutral-950/75 text-white ring-1 ring-white/15 backdrop-blur-sm">
                      {formatPluralCount(collection.itemCount, "pin", "pins")}
                    </Badge>
                    {!collection.isCurated ?
                      <Badge
                        variant="secondary"
                        className="bg-neutral-950/75 text-white ring-1 ring-white/15 backdrop-blur-sm">
                        {collection.isPublicToMembers ?
                          <>
                            <GlobeIcon data-icon="inline-start" />
                            Members
                          </>
                        : <>
                            <LockIcon data-icon="inline-start" />
                            Private
                          </>
                        }
                      </Badge>
                    : null}
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between gap-2 p-4">
                  <div className="grid gap-1">
                    <h2 className="truncate font-semibold tracking-tight">
                      {collection.title}
                    </h2>
                    {collection.description ?
                      <p className="text-caption text-muted-foreground line-clamp-2">
                        {collection.description}
                      </p>
                    : null}
                  </div>
                  <div className="text-caption text-muted-foreground flex items-center justify-between gap-2 pt-1">
                    <span className="truncate">
                      {collection.authorName ?
                        `By ${collection.authorName}`
                      : "Editorial collection"}
                    </span>
                    <span className="shrink-0">
                      {formatRelativeDate(collection.updatedAt)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      }

      {totalPages > 1 ?
        <Pagination
          page={page}
          totalPages={totalPages}
          buildHref={(targetPage: number) =>
            `/collections?tab=${tab}&q=${encodeURIComponent(q)}&page=${targetPage}` as Route
          }
        />
      : null}

      <Dialog
        open={createOpen}
        onOpenChange={(next) => {
          if (!isSubmitting) setCreateOpen(next);
        }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New personal board</DialogTitle>
            <DialogDescription>
              Organize wallpapers into a board visible privately or to signed-in
              members on your creator profile.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(handleCreate)}
            className="grid gap-4"
            noValidate>
            <Controller
              name="title"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="board-title">Board name</FieldLabel>
                  <Input
                    {...field}
                    id="board-title"
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. Dark Minimal, OLED Landscapes"
                  />
                  {fieldState.invalid ?
                    <FieldError errors={[fieldState.error]} />
                  : null}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="board-description">
                    Description (optional)
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="board-description"
                    rows={3}
                    aria-invalid={fieldState.invalid}
                    placeholder="Notes about style, theme, or display aspect"
                  />
                  {fieldState.invalid ?
                    <FieldError errors={[fieldState.error]} />
                  : null}
                </Field>
              )}
            />
            <Controller
              name="isPublicToMembers"
              control={control}
              render={({ field }) => (
                <div className="border-border/60 rounded-inset flex items-center justify-between gap-3 border p-3">
                  <div className="grid gap-0.5">
                    <span className="text-sm font-medium">
                      Visible to members
                    </span>
                    <span className="text-caption text-muted-foreground">
                      Allow signed-in members to view this board on your profile
                    </span>
                  </div>
                  <Switch
                    checked={field.value ?? true}
                    onCheckedChange={(checked) => field.onChange(checked)}
                    aria-label="Visible to members"
                  />
                </div>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}>
                {isSubmitting ?
                  <>
                    <Loader2Icon
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                    Creating...
                  </>
                : <>
                    <CheckIcon data-icon="inline-start" />
                    Create board
                  </>
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionsDirectoryClient;
