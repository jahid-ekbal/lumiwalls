import PageHeader from "@/components/UI/PageHeader";
import StatusBadge, { deriveWallpaperStatus } from "@/components/UI/StatusBadge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/shadcnui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { requireActiveUser } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { formatDate } from "@/lib/format";
import { toImagePath } from "@/lib/imageUrl";
import { createMetadata } from "@/lib/metadata";
import { AlertCircleIcon, ImagesIcon } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import EditWallpaperForm from "./_components/edit-wallpaper-form";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Edit upload",
  description: "Edit the details of one of your wallpapers",
});

type EditWallpaperPageProps = {
  params: Promise<{ id: string }>;
};

const EditWallpaperPage = async ({ params }: EditWallpaperPageProps) => {
  const { user } = await requireActiveUser();

  const { id } = await params;

  const [wallpaper, categories, tags] = await Promise.all([
    prisma.wallpaper.findUnique({
      where: { id },
      select: {
        id: true,
        uploaderId: true,
        title: true,
        description: true,
        categoryId: true,
        createdAt: true,
        isApproved: true,
        isPublic: true,
        thumb400Url: true,
        thumb800Url: true,
        originalUrl: true,
        blurDataUrl: true,
        moderationQueue: {
          select: { status: true, reviewNotes: true },
        },
        tags: {
          select: { tagId: true },
        },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!wallpaper || wallpaper.uploaderId !== user.id) {
    notFound();
  }

  const status = deriveWallpaperStatus({
    isApproved: wallpaper.isApproved,
    moderationStatus: wallpaper.moderationQueue?.status,
  });

  const reviewNotes = wallpaper.moderationQueue?.reviewNotes?.trim() || null;

  const src = toImagePath(
    wallpaper.thumb400Url ?? wallpaper.thumb800Url ?? wallpaper.originalUrl,
  );
  const isOptimizable = wallpaper.isApproved && wallpaper.isPublic;

  return (
    <div className="grid w-full gap-6">
      <PageHeader
        eyebrow="Submissions"
        title="Edit upload"
        description="Update the details of your wallpaper. Rejected uploads are resubmitted for review when you save."
        backHref={"/upload" as Route}
        backLabel="Back to my uploads"
      />

      {status === "REJECTED" && reviewNotes ?
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Moderation feedback</AlertTitle>
          <AlertDescription>{reviewNotes}</AlertDescription>
        </Alert>
      : null}

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <Card className="gap-0 overflow-hidden py-0 lg:col-span-4">
          <div className="bg-muted/40 relative aspect-video overflow-hidden">
            {src ?
              isOptimizable ?
                <Image
                  src={src}
                  alt={wallpaper.title}
                  fill={true}
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  placeholder={wallpaper.blurDataUrl ? "blur" : "empty"}
                  blurDataURL={wallpaper.blurDataUrl ?? undefined}
                  className="object-cover"
                />
              : /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={src}
                  alt={wallpaper.title}
                  className="absolute inset-0 size-full object-cover"
                />
            : <div className="text-muted-foreground flex size-full items-center justify-center">
                <ImagesIcon className="size-10" />
              </div>
            }
            <StatusBadge
              status={status}
              className="absolute top-2.5 left-2.5 shadow-sm"
            />
          </div>
          <CardContent className="grid gap-1 p-3.5">
            <p className="text-body-sm truncate font-medium">
              {wallpaper.title}
            </p>
            <time
              suppressHydrationWarning={true}
              dateTime={wallpaper.createdAt.toISOString()}
              className="text-caption text-muted-foreground">
              Uploaded {formatDate(wallpaper.createdAt)}
            </time>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Wallpaper details</CardTitle>
            <CardDescription>
              Title, description, category, tags, and gallery visibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditWallpaperForm
              wallpaperId={wallpaper.id}
              initialTitle={wallpaper.title}
              initialDescription={wallpaper.description ?? ""}
              initialCategoryId={wallpaper.categoryId ?? ""}
              initialTagIds={wallpaper.tags.map((tag) => tag.tagId)}
              isApproved={wallpaper.isApproved}
              initialIsPublic={wallpaper.isPublic}
              categories={categories}
              tags={tags}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditWallpaperPage;
