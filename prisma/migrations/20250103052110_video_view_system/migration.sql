-- AlterTable
ALTER TABLE "video_views" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "watchDuration" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_video_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "lastVideoSequence" INTEGER NOT NULL DEFAULT 1,
    "lastTimestamp" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_video_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_video_progress_userId_postId_idx" ON "user_video_progress"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "user_video_progress_userId_postId_key" ON "user_video_progress"("userId", "postId");

-- CreateIndex
CREATE INDEX "users_adultauth_idx" ON "users"("adultauth");

-- CreateIndex
CREATE INDEX "users_mscoin_idx" ON "users"("mscoin");

-- CreateIndex
CREATE INDEX "video_views_userId_createdAt_idx" ON "video_views"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "videos_isPremium_idx" ON "videos"("isPremium");

-- AddForeignKey
ALTER TABLE "user_video_progress" ADD CONSTRAINT "user_video_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_video_progress" ADD CONSTRAINT "user_video_progress_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
