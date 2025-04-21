/*
  Warnings:

  - You are about to drop the column `deleteSet` on the `video_views` table. All the data in the column will be lost.
  - Added the required column `referredBy` to the `video_views` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploaderId` to the `video_views` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "video_views" DROP COLUMN "deleteSet",
ADD COLUMN     "referredBy" TEXT NOT NULL,
ADD COLUMN     "teamMaster" TEXT,
ADD COLUMN     "uploaderId" TEXT NOT NULL;
