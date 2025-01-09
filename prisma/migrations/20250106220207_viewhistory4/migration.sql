-- DropIndex
DROP INDEX "video_views_userId_videoId_key";

-- AlterTable
ALTER TABLE "video_views" ADD COLUMN     "timestamp" INTEGER;
