-- AlterTable
ALTER TABLE "collection" ADD COLUMN     "isCurated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublicToMembers" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ownerId" TEXT;

-- Mark existing admin-created collections as curated
UPDATE "collection" SET "isCurated" = true WHERE "ownerId" IS NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "wallpaper" DROP COLUMN "avgRating";

-- CreateTable
CREATE TABLE "view_log" (
    "id" TEXT NOT NULL,
    "wallpaperId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "view_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "download_log" (
    "id" TEXT NOT NULL,
    "wallpaperId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variant" VARCHAR(16) NOT NULL DEFAULT 'original',
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit" (
    "key" VARCHAR(160) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "admin_audit_log" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" VARCHAR(64) NOT NULL,
    "targetType" VARCHAR(32) NOT NULL,
    "targetId" VARCHAR(128) NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "view_log_wallpaperId_viewedAt_idx" ON "view_log"("wallpaperId", "viewedAt" DESC);

-- CreateIndex
CREATE INDEX "view_log_userId_viewedAt_idx" ON "view_log"("userId", "viewedAt" DESC);

-- CreateIndex
CREATE INDEX "view_log_viewedAt_idx" ON "view_log"("viewedAt" DESC);

-- CreateIndex
CREATE INDEX "download_log_userId_downloadedAt_idx" ON "download_log"("userId", "downloadedAt" DESC);

-- CreateIndex
CREATE INDEX "download_log_wallpaperId_downloadedAt_idx" ON "download_log"("wallpaperId", "downloadedAt" DESC);

-- CreateIndex
CREATE INDEX "download_log_downloadedAt_idx" ON "download_log"("downloadedAt" DESC);

-- CreateIndex
CREATE INDEX "rate_limit_resetAt_idx" ON "rate_limit"("resetAt");

-- CreateIndex
CREATE INDEX "admin_audit_log_createdAt_idx" ON "admin_audit_log"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "admin_audit_log_actorId_createdAt_idx" ON "admin_audit_log"("actorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "admin_audit_log_action_createdAt_idx" ON "admin_audit_log"("action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "collection_ownerId_updatedAt_idx" ON "collection"("ownerId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "collection_isCurated_active_sortOrder_idx" ON "collection"("isCurated", "active", "sortOrder");

-- AddForeignKey
ALTER TABLE "collection" ADD CONSTRAINT "collection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "view_log" ADD CONSTRAINT "view_log_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "wallpaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "view_log" ADD CONSTRAINT "view_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_log" ADD CONSTRAINT "download_log_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "wallpaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_log" ADD CONSTRAINT "download_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
