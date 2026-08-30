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
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = createMetadata({
  title: "Upload",
  description: "Upload a new wallpaper to Lumiwalls",
});

const UploadPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/");
  }

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Wallpaper</CardTitle>
          <CardDescription>
            Share your wallpaper with the community
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

export default UploadPage;
