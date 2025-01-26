-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "thumbnailId" TEXT;

-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "cloudflareId" TEXT;

-- CreateIndex
CREATE INDEX "videos_cloudflareId_idx" ON "videos"("cloudflareId");
