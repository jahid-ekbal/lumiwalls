"use client";

import { Input } from "@/components/shadcnui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import { SearchIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { browseParsers } from "./browse-search-params";
import type { BrowseCategoryOption } from "./browse-types";

type BrowseFiltersProps = {
  categories: BrowseCategoryOption[];
  total: number;
};

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "views", label: "Most viewed" },
  { value: "downloads", label: "Most downloaded" },
] as const;

const BrowseFilters = ({ categories, total }: BrowseFiltersProps) => {
  const [query, setQuery] = useQueryState("q", browseParsers.q);
  const [category, setCategory] = useQueryState(
    "category",
    browseParsers.category,
  );
  const [sort, setSort] = useQueryState("sort", browseParsers.sort);
  const [page, setPage] = useQueryState("page", browseParsers.page);
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
      if (page !== 1) {
        void setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [input, query, page, setQuery, setPage]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Search title, description, or tag"
            autoComplete="off"
            aria-label="Search wallpapers"
            className="pl-9"
          />
        </div>
        <Select
          value={category}
          onValueChange={(value) => {
            void setCategory(value);
            if (page !== 1) {
              void setPage(1);
            }
          }}>
          <SelectTrigger
            aria-label="Filter by category"
            className="w-full sm:w-56">
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
        <Select
          value={sort}
          onValueChange={(value) => {
            void setSort(value as (typeof sortOptions)[number]["value"]);
            if (page !== 1) {
              void setPage(1);
            }
          }}>
          <SelectTrigger
            aria-label="Sort wallpapers"
            className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((item) => (
              <SelectItem
                key={item.value}
                value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p
        aria-live="polite"
        className="text-muted-foreground text-xs">
        {`${total.toLocaleString()} ${total === 1 ? "result" : "results"}`}
      </p>
    </div>
  );
};

export default BrowseFilters;
