/*
  Warnings:

  - You are about to drop the column `language` on the `videos` table. All the data in the column will be lost.
  - You are about to drop the `post_media` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "post_media" DROP CONSTRAINT "post_media_postId_fkey";

-- AlterTable
ALTER TABLE "videos" DROP COLUMN "language";

-- DropTable
DROP TABLE "post_media";
