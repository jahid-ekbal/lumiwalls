-- CreateTable
CREATE TABLE "collection" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "curatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_item" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "wallpaperId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collection_slug_key" ON "collection"("slug");

-- CreateIndex
CREATE INDEX "collection_slug_idx" ON "collection"("slug");

-- CreateIndex
CREATE INDEX "collection_active_sortOrder_idx" ON "collection"("active", "sortOrder");

-- CreateIndex
CREATE INDEX "collection_item_collectionId_position_idx" ON "collection_item"("collectionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "collection_item_collectionId_wallpaperId_key" ON "collection_item"("collectionId", "wallpaperId");

-- AddForeignKey
ALTER TABLE "collection" ADD CONSTRAINT "collection_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_item" ADD CONSTRAINT "collection_item_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_item" ADD CONSTRAINT "collection_item_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "wallpaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
