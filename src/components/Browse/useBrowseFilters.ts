"use client";

import {
  browseParsers,
  browseFeaturedValues,
  browseOrientationValues,
} from "./browse-search-params";
import { useQueryState } from "nuqs";

export function useBrowseFilterParams() {
  const [query, setQuery] = useQueryState("q", browseParsers.q);
  const [category, setCategory] = useQueryState(
    "category",
    browseParsers.category,
  );
  const [selectedTags, setSelectedTags] = useQueryState(
    "tags",
    browseParsers.tags,
  );
  const [orientation, setOrientation] = useQueryState(
    "orientation",
    browseParsers.orientation,
  );
  const [featured, setFeatured] = useQueryState(
    "featured",
    browseParsers.featured,
  );
  const [selectedColors, setSelectedColors] = useQueryState(
    "colors",
    browseParsers.colors,
  );
  const [sort, setSort] = useQueryState("sort", browseParsers.sort);
  const [, setPage] = useQueryState("page", browseParsers.page);

  const trimmedQuery = query.trim();
  const activeCount =
    (trimmedQuery !== "" ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    selectedTags.length +
    (orientation !== "any" ? 1 : 0) +
    (featured === "featured" ? 1 : 0) +
    selectedColors.length;
  const hasFilters = activeCount > 0;

  const change = <T>(setter: (value: T) => Promise<unknown>, value: T) => {
    void setter(value);
    void setPage(1);
  };

  const clearAll = () => {
    void setQuery("");
    void setCategory("all");
    void setSelectedTags(null);
    void setOrientation("any");
    void setFeatured("any");
    void setSelectedColors(null);
    void setPage(1);
  };

  return {
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
    setPage,
    change,
    clearAll,
    activeCount,
    hasFilters,
    orientationValues: browseOrientationValues,
    featuredValues: browseFeaturedValues,
  };
}
