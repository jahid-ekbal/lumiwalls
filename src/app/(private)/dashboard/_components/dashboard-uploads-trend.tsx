import UserUploadsTrendChart from "@/components/Dashboard/UserUploadsTrendChart";
import { getActiveSession } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { buildUploadTrend, TREND_DAYS } from "./dashboard-utils";

const DashboardUploadsTrend = async () => {
  const session = await getActiveSession();

  if (!session?.user) {
    return null;
  }

  const now = new Date();
  const trendStart = new Date(now);
  trendStart.setUTCDate(now.getUTCDate() - (TREND_DAYS - 1));
  trendStart.setUTCHours(0, 0, 0, 0);

  const uploads = await prisma.wallpaper.findMany({
    where: {
      uploaderId: session.user.id,
      createdAt: { gte: trendStart },
    },
    select: { createdAt: true },
  });

  const trend = buildUploadTrend(
    uploads.map((item) => item.createdAt),
    now,
  );

  return <UserUploadsTrendChart data={trend} />;
};

export default DashboardUploadsTrend;
