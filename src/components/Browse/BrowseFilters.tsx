"use client";

import { Button } from "@/components/shadcnui/button";
import { Input } from "@/components/shadcnui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/shadcnui/sheet";
import { COLOR_BUCKETS } from "@/lib/colorBuckets";
import { cn } from "@/lib/utils";
import {
  EraserIcon,
  LayoutGridIcon,
  ListFilterIcon,
  RectangleHorizontalIcon,
  RectangleVerticalIcon,
  SearchIcon,
  SparklesIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BrowseCategoryOption, BrowseTagOption } from "./browse-types";
import { useBrowseFilterParams } from "./useBrowseFilters";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "views", label: "Most viewed" },
  { value: "downloads", label: "Most downloaded" },
] as const;

const ORIENTATION_OPTIONS = [
  { value: "any", label: "Any", Icon: LayoutGridIcon },
  { value: "landscape", label: "Landscape", Icon: RectangleHorizontalIcon },
  { value: "portrait", label: "Portrait", Icon: RectangleVerticalIcon },
  { value: "square", label: "Square", Icon: SquareIcon },
] as const;

type ChipProps = {
  label: string;
  onClear: () => void;
  swatch?: string;
};

const Chip = ({ label, onClear, swatch }: ChipProps) => (
  <button
    type="button"
    onClick={onClear}
    className="bg-card hover:bg-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition">
    {swatch ?
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full border border-white/20"
        style={{ backgroundColor: swatch }}
      />
    : null}
    {label}
    <XIcon className="size-3 opacity-60" />
    <span className="sr-only">, press to remove this filter</span>
  </button>
);

type BrowseFiltersProps = {
  categories: BrowseCategoryOption[];
  tagOptions: BrowseTagOption[];
  total: number;
  unavailableBuckets: number[];
};

const BrowseFilters = ({
  categories,
  tagOptions,
  total,
  unavailableBuckets,
}: BrowseFiltersProps) => {
  const {
    query,
    setQuery,
    category,
    setCategory,
    selectedTags,
    setSelectedTags,
    orientation,
    setOrientation,
    featured,
    setFeatured,
    selectedColors,
    setSelectedColors,
    sort,
    setSort,
    change,
    clearAll,
    activeCount,
    hasFilters,
  } = useBrowseFilterParams();

  const [input, setInput] = useState(query);
  const [sheetOpen, setSheetOpen] = useState(false);
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
      void change(setQuery, input.trim() === "" ? "" : input);
    }, 350);
    return () => clearTimeout(timer);
  }, [input, query, change, setQuery]);

  const tagNames = useMemo(
    () => new Map(tagOptions.map((tag) => [tag.slug, tag.name])),
    [tagOptions],
  );
  const categoryNames = useMemo(
    () => new Map(categories.map((item) => [item.slug, item.name])),
    [categories],
  );
  const sortItems = useMemo(
    () =>
      SORT_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
    [],
  );
  const categoryItems = useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...categories.map((item) => ({
        value: item.slug,
        label: `${item.name} (${item.count})`,
      })),
    ],
    [categories],
  );
  const unavailable = useMemo(
    () => new Set(unavailableBuckets),
    [unavailableBuckets],
  );

  const clearTag = (slug: string) =>
    change(
      setSelectedTags,
      selectedTags.filter((entry) => entry !== slug),
    );
  const clearColor = (index: number) =>
    change(
      setSelectedColors,
      selectedColors.filter((entry) => entry !== index),
    );
  const toggleTag = (slug: string) => {
    if (selectedTags.includes(slug)) {
      clearTag(slug);
      return;
    }
    change(setSelectedTags, [...selectedTags, slug]);
  };
  const toggleColor = (index: number) => {
    if (selectedColors.includes(index)) {
      clearColor(index);
      return;
    }
    change(setSelectedColors, [...selectedColors, index]);
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Search title, description, or tag"
            autoComplete="off"
            aria-label="Search wallpapers"
            className="rounded-full pl-9"
          />
        </div>
        <Select
          value={sort}
          items={sortItems}
          onValueChange={(value) => change(setSort, value ?? "newest")}>
          <SelectTrigger
            aria-label="Sort wallpapers"
            className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((item) => (
              <SelectItem
                key={item.value}
                value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={hasFilters ? "secondary" : "outline"}
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen(true)}
          className="justify-between sm:w-40">
          <span className="flex items-center gap-2">
            <ListFilterIcon
              data-icon="inline-start"
              className="size-4"
            />
            Filters
          </span>
          {activeCount > 0 ?
            <span className="bg-primary text-primary-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px]">
              {activeCount}
            </span>
          : null}
        </Button>
      </div>
      {hasFilters ?
        <div className="flex flex-wrap items-center gap-1.5">
          {query.trim() !== "" ?
            <Chip
              label={`"${query.trim()}"`}
              onClear={() => change(setQuery, "")}
            />
          : null}
          {category !== "all" ?
            <Chip
              label={categoryNames.get(category) ?? category}
              onClear={() => change(setCategory, "all")}
            />
          : null}
          {selectedTags.map((slug) => (
            <Chip
              key={slug}
              label={tagNames.get(slug) ?? slug}
              onClear={() => clearTag(slug)}
            />
          ))}
          {orientation !== "any" ?
            <Chip
              label={
                ORIENTATION_OPTIONS.find((item) => item.value === orientation)
                  ?.label ?? orientation
              }
              onClear={() => change(setOrientation, "any")}
            />
          : null}
          {featured === "featured" ?
            <Chip
              label="Featured and picks"
              onClear={() => change(setFeatured, "any")}
            />
          : null}
          {selectedColors.map((index) => {
            const bucket = COLOR_BUCKETS.find((item) => item.index === index);
            return (
              <Chip
                key={index}
                label={bucket ? `${bucket.name}` : `Color ${index}`}
                swatch={bucket ? `${bucket.swatch}` : undefined}
                onClear={() => clearColor(index)}
              />
            );
          })}
        </div>
      : null}
      <p
        aria-live="polite"
        className="text-muted-foreground text-xs">
        {`${total.toLocaleString()} ${total === 1 ? "result" : "results"}`}
      </p>
      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              {`${total.toLocaleString()} results match the browsing filters`}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-6 px-6 pb-6">
            <section className="grid gap-2">
              <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Category
              </h3>
              <Select
                value={category}
                items={categoryItems}
                onValueChange={(value) => change(setCategory, value ?? "all")}>
                <SelectTrigger aria-label="Filter by category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((item) => (
                    <SelectItem
                      key={item.slug}
                      value={item.slug}>
                      {`${item.name} (${item.count})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>
            <section className="grid gap-2">
              <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Tags
              </h3>
              <div className="bg-background/50 flex max-h-56 flex-wrap gap-1.5 overflow-y-auto rounded-xl border p-2">
                {tagOptions.length === 0 ?
                  <p className="text-muted-foreground text-xs">No tags yet</p>
                : tagOptions.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.slug)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition",
                        selectedTags.includes(tag.slug) ?
                          "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                      )}>
                      {tag.name}
                    </button>
                  ))
                }
              </div>
            </section>
            <section className="grid gap-2">
              <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Orientation
              </h3>
              <div className="grid grid-cols-4 gap-1.5">
                {ORIENTATION_OPTIONS.map(({ value, label, Icon }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={orientation === value ? "secondary" : "outline"}
                    size="sm"
                    aria-pressed={orientation === value}
                    onClick={() => change(setOrientation, value)}
                    className="h-auto flex-col gap-1 px-1 py-2">
                    <Icon
                      data-icon="inline-start"
                      className="size-4"
                    />
                    <span className="text-[11px]">{label}</span>
                  </Button>
                ))}
              </div>
            </section>
            <section className="grid gap-2">
              <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Featured
              </h3>
              <Button
                type="button"
                variant={featured === "featured" ? "default" : "outline"}
                aria-pressed={featured === "featured"}
                onClick={() =>
                  change(
                    setFeatured,
                    featured === "featured" ? "any" : "featured",
                  )
                }>
                <SparklesIcon
                  data-icon="inline-start"
                  className="size-4"
                />
                Featured and editors picks
              </Button>
            </section>
            <section className="grid gap-2">
              <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Dominant color
              </h3>
              <div className="grid grid-cols-3 gap-1.5">
                {COLOR_BUCKETS.map((bucket) => {
                  const busy = unavailable.has(bucket.index);
                  const active = selectedColors.includes(bucket.index);
                  return (
                    <button
                      key={bucket.index}
                      type="button"
                      disabled={busy}
                      onClick={() => toggleColor(bucket.index)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs transition",
                        busy && "opacity-40",
                        active ? "border-ring bg-muted" : "hover:bg-muted/50",
                      )}>
                      <span
                        aria-hidden="true"
                        className="size-3 shrink-0 rounded-full border border-white/20"
                        style={{ backgroundColor: bucket.swatch }}
                      />
                      {bucket.name}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
          <SheetFooter className="flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={!hasFilters}
              onClick={clearAll}>
              <EraserIcon
                data-icon="inline-start"
                className="size-4"
              />
              Clear all
            </Button>
            <SheetClose render={<Button className="flex-1" />}>Done</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default BrowseFilters;
