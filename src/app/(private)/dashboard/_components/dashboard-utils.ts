import type { UploadTrendPoint } from "@/components/Dashboard/UserUploadsTrendChart";
import type { AppStatus } from "@/components/UI/StatusBadge";
import { formatUtcDayLabel } from "@/lib/format";

export type ModerationStatus = AppStatus;

export { deriveWallpaperStatus as resolveModerationStatus } from "@/components/UI/StatusBadge";

export const TREND_DAYS = 30;

export const toDayKey = (date: Date) => date.toISOString().slice(0, 10);

export const buildUploadTrend = (
  uploadDates: Date[],
  now: Date,
): UploadTrendPoint[] => {
  const buckets = new Map<string, { uploads: number }>();

  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setUTCDate(now.getUTCDate() - i);
    buckets.set(toDayKey(day), { uploads: 0 });
  }

  for (const date of uploadDates) {
    const bucket = buckets.get(toDayKey(date));
    if (bucket) {
      bucket.uploads += 1;
    }
  }

  return [...buckets.entries()].map(([date, counts]) => ({
    date,
    label: formatUtcDayLabel(date),
    ...counts,
  }));
};
