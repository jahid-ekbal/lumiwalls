"use client";

import { useQueryState } from "nuqs";
import {
  browseFeaturedValues,
  browseFeedValues,
  browseOrientationValues,
  browseParsers,
} from "./browse-search-params";

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
  const [feed, setFeed] = useQueryState("feed", browseParsers.feed);
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
    (feed === "following" ? 1 : 0) +
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
    void setFeed("all");
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
    feed,
    setFeed,
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
    feedValues: browseFeedValues,
  };
}
