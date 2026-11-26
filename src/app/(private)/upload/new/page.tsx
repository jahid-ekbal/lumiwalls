import PageHeader from "@/components/UI/PageHeader";
import UploadForm from "@/components/Upload/UploadForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { createMetadata } from "@/lib/metadata";
import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = createMetadata({
  title: "New upload",
  description: "Upload a new wallpaper to Lumiwalls",
});

const NewUploadPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/");
  }

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Submissions"
        title="New upload"
        description="Share a wallpaper with the community. Submissions are reviewed before appearing in Browse."
        backHref={"/upload" as Route}
        backLabel="Back to my uploads"
      />

      <Card>
        <CardHeader>
          <CardTitle>Wallpaper submission</CardTitle>
          <CardDescription>
            Choose an image, add details, and submit it for review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadForm
            categories={categories}
            tags={tags}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewUploadPage;
