import AdminTrendChart from "@/components/Admin/AdminTrendChart";
import prisma from "@/lib/database/dbClient";
import { buildTrend, TREND_DAYS } from "./dashboard-utils";

const DashboardTrend = async () => {
  const now = new Date();
  const trendStart = new Date(now);
  trendStart.setUTCDate(now.getUTCDate() - (TREND_DAYS - 1));
  trendStart.setUTCHours(0, 0, 0, 0);

  const [wallpaperCreatedDates, userCreatedDates] = await Promise.all([
    prisma.wallpaper.findMany({
      where: { createdAt: { gte: trendStart } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: trendStart } },
      select: { createdAt: true },
    }),
  ]);

  const trend = buildTrend(
    wallpaperCreatedDates.map((item) => item.createdAt),
    userCreatedDates.map((item) => item.createdAt),
    now,
  );

  return <AdminTrendChart data={trend} />;
};

export default DashboardTrend;
