/*
  Warnings:

  - Added the required column `postId` to the `video_views` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "video_views" ADD COLUMN     "postId" TEXT NOT NULL,
ALTER COLUMN "referredBy" DROP NOT NULL;
