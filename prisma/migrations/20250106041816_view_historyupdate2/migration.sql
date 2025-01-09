/*
  Warnings:

  - You are about to drop the column `lastTimestamp` on the `user_video_progress` table. All the data in the column will be lost.
  - You are about to drop the column `lastTimestamp` on the `video_views` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_video_progress" DROP COLUMN "lastTimestamp";

-- AlterTable
ALTER TABLE "video_views" DROP COLUMN "lastTimestamp";
