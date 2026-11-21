import { Badge } from "@/components/shadcnui/badge";
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
import { toImagePath } from "@/lib/imageUrl";
import { createMetadata } from "@/lib/metadata";
import { format } from "date-fns";
import { ArrowLeftIcon, ImagesIcon } from "lucide-react";
import type { Route } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EditWallpaperForm from "./_components/edit-wallpaper-form";

export const metadata = createMetadata({
  title: "Edit upload",
  description: "Edit the details of one of your wallpapers",
});

type EditWallpaperPageProps = {
  params: Promise<{ id: string }>;
};

const EditWallpaperPage = async ({ params }: EditWallpaperPageProps) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/");
  }

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
          select: { status: true },
        },
        tags: {
          select: { tagId: true },
        },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!wallpaper || wallpaper.uploaderId !== session.user.id) {
    notFound();
  }

  const status =
    wallpaper.isApproved ? { label: "Approved", variant: "default" as const }
    : wallpaper.moderationQueue?.status === "REJECTED" ?
      { label: "Rejected", variant: "destructive" as const }
    : { label: "Pending review", variant: "secondary" as const };

  const src = toImagePath(
    wallpaper.thumb400Url ?? wallpaper.thumb800Url ?? wallpaper.originalUrl,
  );
  const isOptimizable = wallpaper.isApproved && wallpaper.isPublic;

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
              Edit upload
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Update the details of your wallpaper. Rejected uploads are
              resubmitted for review when you save.
            </p>
          </div>
        </div>

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
              <Badge
                variant={status.variant}
                className="absolute top-2 left-2 shadow-sm">
                {status.label}
              </Badge>
            </div>
            <CardContent className="grid gap-1 p-3">
              <p className="truncate text-sm font-medium">{wallpaper.title}</p>
              <time
                suppressHydrationWarning={true}
                dateTime={wallpaper.createdAt.toISOString()}
                className="text-muted-foreground text-xs">
                Uploaded {format(wallpaper.createdAt, "MMM d, yyyy")}
              </time>
            </CardContent>
          </Card>

          <Card className="lg:col-span-8">
            <CardHeader>
              <CardTitle>Wallpaper details</CardTitle>
              <CardDescription>
                Title, description, category, and tags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditWallpaperForm
                wallpaperId={wallpaper.id}
                initialTitle={wallpaper.title}
                initialDescription={wallpaper.description ?? ""}
                initialCategoryId={wallpaper.categoryId ?? ""}
                initialTagIds={wallpaper.tags.map((tag) => tag.tagId)}
                categories={categories}
                tags={tags}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditWallpaperPage;
