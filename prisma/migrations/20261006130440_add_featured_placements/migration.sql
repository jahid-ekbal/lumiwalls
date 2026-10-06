-- CreateEnum
CREATE TYPE "Placement" AS ENUM ('HERO', 'TRENDING', 'SEASONAL');

-- CreateTable
CREATE TABLE "featured_placement" (
    "id" TEXT NOT NULL,
    "wallpaperId" TEXT NOT NULL,
    "placement" "Placement" NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "curatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "featured_placement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "featured_placement_placement_active_startAt_endAt_idx" ON "featured_placement"("placement", "active", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "featured_placement_wallpaperId_idx" ON "featured_placement"("wallpaperId");

-- CreateIndex
CREATE INDEX "featured_placement_active_priority_idx" ON "featured_placement"("active", "priority");

-- AddForeignKey
ALTER TABLE "featured_placement" ADD CONSTRAINT "featured_placement_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "wallpaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "featured_placement" ADD CONSTRAINT "featured_placement_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
