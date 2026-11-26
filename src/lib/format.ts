import { format, formatDistanceToNow } from "date-fns";

const numberFormatter = new Intl.NumberFormat("en-US");

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCount(value: number): string {
  return numberFormatter.format(value);
}

export function formatCompactCount(value: number): string {
  return compactFormatter.format(value);
}

export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return count === 1 ? singular : plural;
}

export function formatPluralCount(
  count: number,
  singular: string,
  plural?: string,
  options?: { compact?: boolean },
): string {
  const formatted =
    options?.compact ? formatCompactCount(count) : formatCount(count);
  return `${formatted} ${pluralize(count, singular, plural)}`;
}

export function formatBytes(
  bytes: number | null | undefined,
  fallback = "0 B",
): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes < 0) {
    return fallback;
  }
  if (bytes === 0) {
    return "0 B";
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDate(
  value: Date | string | number,
  pattern = "MMM d, yyyy",
): string {
  const date = value instanceof Date ? value : new Date(value);
  return format(date, pattern);
}

export function formatUtcDayLabel(
  isoDay: string,
  pattern = "MMM d",
): string {
  const [yearText, monthText, dayText] = isoDay.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!year || !month || !day) {
    return isoDay;
  }
  return format(new Date(year, month - 1, day), pattern);
}

export function formatRelativeDate(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function initialsOf(name: string, fallback = ""): string {
  const source = name.trim() || fallback.trim();
  if (!source) {
    return "?";
  }
  const parts = source.split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
