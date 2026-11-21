import UploadForm from "@/components/Upload/UploadForm";
import { buttonVariants } from "@/components/shadcnui/button";
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
import { ArrowLeftIcon } from "lucide-react";
import type { Route } from "next";
import { headers } from "next/headers";
import Link from "next/link";
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
    <div className="w-full p-6">
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Link
            href={"/upload" as Route}
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "w-fit",
            })}>
            <ArrowLeftIcon
              data-icon="inline-start"
              className="size-4"
            />
            Back to my uploads
          </Link>
          <div className="grid gap-1">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              New upload
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Share a wallpaper with the community. Uploads are reviewed before
              they appear in Browse.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload wallpaper</CardTitle>
            <CardDescription>
              Pick an image, add the details, and submit it for review
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
    </div>
  );
};

export default NewUploadPage;
