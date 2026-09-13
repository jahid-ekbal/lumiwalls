import { parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs";

export const browseSortValues = [
  "newest",
  "oldest",
  "views",
  "downloads",
] as const;

const noScrollPush = {
  history: "push" as const,
  shallow: false,
  clearOnDefault: true,
  scroll: false,
};

export const browseParsers = {
  q: parseAsString.withDefault("").withOptions(noScrollPush),
  category: parseAsString.withDefault("all").withOptions(noScrollPush),
  sort: parseAsStringLiteral(browseSortValues)
    .withDefault("newest")
    .withOptions(noScrollPush),
  page: parseAsInteger.withDefault(1).withOptions(noScrollPush),
  preview: parseAsString.withDefault("").withOptions(noScrollPush),
};
