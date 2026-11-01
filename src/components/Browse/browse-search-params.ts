import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs";

export const browseSortValues = [
  "newest",
  "oldest",
  "views",
  "downloads",
] as const;

export const browseOrientationValues = [
  "any",
  "landscape",
  "portrait",
  "square",
] as const;

export const browseFeaturedValues = ["any", "featured"] as const;

const noScrollPush = {
  history: "push" as const,
  shallow: false,
  clearOnDefault: true,
  scroll: false,
};

export const browseParsers = {
  q: parseAsString.withDefault("").withOptions(noScrollPush),
  category: parseAsString.withDefault("all").withOptions(noScrollPush),
  tags: parseAsArrayOf(parseAsString).withDefault([]).withOptions(noScrollPush),
  orientation: parseAsStringLiteral(browseOrientationValues)
    .withDefault("any")
    .withOptions(noScrollPush),
  featured: parseAsStringLiteral(browseFeaturedValues)
    .withDefault("any")
    .withOptions(noScrollPush),
  colors: parseAsArrayOf(parseAsInteger)
    .withDefault([])
    .withOptions(noScrollPush),
  sort: parseAsStringLiteral(browseSortValues)
    .withDefault("newest")
    .withOptions(noScrollPush),
  page: parseAsInteger.withDefault(1).withOptions(noScrollPush),
  preview: parseAsString.withDefault("").withOptions(noScrollPush),
};
