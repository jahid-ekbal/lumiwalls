import PageHeader from "@/components/UI/PageHeader";
import UploadForm from "@/components/Upload/UploadForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { requireActiveUser } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { createMetadata } from "@/lib/metadata";
import type { Route } from "next";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "New upload",
  description: "Upload a new wallpaper to Lumiwalls",
});

const MAX_UPLOADS_PER_HOUR = 5;

const NewUploadPage = async () => {
  const { user } = await requireActiveUser();

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [categories, tags, recentUploadCount] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.wallpaper.count({
      where: {
        uploaderId: user.id,
        createdAt: { gte: oneHourAgo },
      },
    }),
  ]);

  const remainingQuota = Math.max(0, MAX_UPLOADS_PER_HOUR - recentUploadCount);

  return (
    <div className="grid w-full gap-6">
      <PageHeader
        eyebrow="Submissions"
        title="New upload"
        description="Share one or more wallpapers with the community. Submissions are reviewed before appearing in Browse."
        backHref={"/upload" as Route}
        backLabel="Back to my uploads"
      />

      <Card>
        <CardHeader>
          <CardTitle>Wallpaper submission queue</CardTitle>
          <CardDescription>
            Choose up to {MAX_UPLOADS_PER_HOUR} images per hour, add details, and
            submit them for moderation review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadForm
            categories={categories}
            tags={tags}
            remainingQuota={remainingQuota}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewUploadPage;
