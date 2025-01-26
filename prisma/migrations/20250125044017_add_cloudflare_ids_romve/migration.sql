/*
  Warnings:

  - You are about to drop the column `cloudflareId` on the `videos` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "videos_cloudflareId_idx";

-- AlterTable
ALTER TABLE "videos" DROP COLUMN "cloudflareId";
