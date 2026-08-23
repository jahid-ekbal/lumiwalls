-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallpaper_tag" (
    "wallpaperId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallpaper_tag_pkey" PRIMARY KEY ("wallpaperId","tagId")
);

-- CreateTable
CREATE TABLE "wallpaper" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "originalUrl" TEXT,
    "thumb400Url" TEXT,
    "thumb800Url" TEXT,
    "thumb1920Url" TEXT,
    "blurDataUrl" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT,
    "fileSize" INTEGER,
    "aspectRatio" TEXT,
    "aspectRatioValue" DOUBLE PRECISION,
    "dominantColors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pHash" VARCHAR(64),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "editorsPick" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "uploaderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallpaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_queue" (
    "id" TEXT NOT NULL,
    "wallpaperId" TEXT NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerId" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_name_key" ON "category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- CreateIndex
CREATE INDEX "category_slug_idx" ON "category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tag_slug_key" ON "tag"("slug");

-- CreateIndex
CREATE INDEX "tag_slug_idx" ON "tag"("slug");

-- CreateIndex
CREATE INDEX "wallpaper_tag_tagId_idx" ON "wallpaper_tag"("tagId");

-- CreateIndex
CREATE INDEX "wallpaper_tag_wallpaperId_idx" ON "wallpaper_tag"("wallpaperId");

-- CreateIndex
CREATE UNIQUE INDEX "wallpaper_slug_key" ON "wallpaper"("slug");

-- CreateIndex
CREATE INDEX "wallpaper_slug_idx" ON "wallpaper"("slug");

-- CreateIndex
CREATE INDEX "wallpaper_categoryId_idx" ON "wallpaper"("categoryId");

-- CreateIndex
CREATE INDEX "wallpaper_uploaderId_idx" ON "wallpaper"("uploaderId");

-- CreateIndex
CREATE INDEX "wallpaper_createdAt_idx" ON "wallpaper"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "wallpaper_pHash_idx" ON "wallpaper"("pHash");

-- CreateIndex
CREATE INDEX "wallpaper_aspectRatio_idx" ON "wallpaper"("aspectRatio");

-- CreateIndex
CREATE INDEX "wallpaper_isApproved_idx" ON "wallpaper"("isApproved");

-- CreateIndex
CREATE INDEX "wallpaper_featured_idx" ON "wallpaper"("featured");

-- CreateIndex
CREATE INDEX "wallpaper_editorsPick_idx" ON "wallpaper"("editorsPick");

-- CreateIndex
CREATE INDEX "wallpaper_isApproved_isPublic_createdAt_idx" ON "wallpaper"("isApproved", "isPublic", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "wallpaper_categoryId_createdAt_idx" ON "wallpaper"("categoryId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "wallpaper_uploaderId_createdAt_idx" ON "wallpaper"("uploaderId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "moderation_queue_wallpaperId_key" ON "moderation_queue"("wallpaperId");

-- CreateIndex
CREATE INDEX "moderation_queue_status_idx" ON "moderation_queue"("status");

-- CreateIndex
CREATE INDEX "moderation_queue_reviewerId_idx" ON "moderation_queue"("reviewerId");

-- CreateIndex
CREATE INDEX "moderation_queue_createdAt_idx" ON "moderation_queue"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "wallpaper_tag" ADD CONSTRAINT "wallpaper_tag_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "wallpaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallpaper_tag" ADD CONSTRAINT "wallpaper_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallpaper" ADD CONSTRAINT "wallpaper_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallpaper" ADD CONSTRAINT "wallpaper_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "wallpaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
