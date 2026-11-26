import type { TrendPoint } from "@/components/Admin/AdminTrendChart";
import { formatDate as formatSharedDate, formatUtcDayLabel, initialsOf } from "@/lib/format";

export const TREND_DAYS = 30;
export const PREVIEW_TAKE = 5;

export const toDayKey = (date: Date) => date.toISOString().slice(0, 10);

export const buildTrend = (
  wallpaperDates: Date[],
  userDates: Date[],
  now: Date,
): TrendPoint[] => {
  const buckets = new Map<string, { wallpapers: number; users: number }>();

  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setUTCDate(now.getUTCDate() - i);
    buckets.set(toDayKey(day), { wallpapers: 0, users: 0 });
  }

  for (const date of wallpaperDates) {
    const bucket = buckets.get(toDayKey(date));
    if (bucket) {
      bucket.wallpapers += 1;
    }
  }

  for (const date of userDates) {
    const bucket = buckets.get(toDayKey(date));
    if (bucket) {
      bucket.users += 1;
    }
  }

  return [...buckets.entries()].map(([date, counts]) => ({
    date,
    label: formatUtcDayLabel(date),
    ...counts,
  }));
};

export const formatDate = (date: Date) => formatSharedDate(date);

export const initials = (name: string, email: string) =>
  initialsOf(name, email);
