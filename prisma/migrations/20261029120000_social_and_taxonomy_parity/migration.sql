-- AlterTable
ALTER TABLE "user" ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "handle" TEXT,
ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "tag" ADD COLUMN     "color" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "icon" TEXT;

-- CreateTable
CREATE TABLE "favorite" (
    "userId" TEXT NOT NULL,
    "wallpaperId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_pkey" PRIMARY KEY ("userId","wallpaperId")
);

-- CreateTable
CREATE TABLE "follow" (
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_pkey" PRIMARY KEY ("followerId","followingId")
);

-- CreateIndex
CREATE INDEX "favorite_wallpaperId_idx" ON "favorite"("wallpaperId");

-- CreateIndex
CREATE INDEX "favorite_userId_createdAt_idx" ON "favorite"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "follow_followingId_createdAt_idx" ON "follow"("followingId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "follow_followerId_createdAt_idx" ON "follow"("followerId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_handle_key" ON "user"("handle");

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "wallpaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow" ADD CONSTRAINT "follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow" ADD CONSTRAINT "follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
