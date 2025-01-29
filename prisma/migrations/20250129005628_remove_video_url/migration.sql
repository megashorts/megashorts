/*
  Warnings:

  - You are about to drop the column `thumbnailUrl` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `videos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "posts" DROP COLUMN "thumbnailUrl";

-- AlterTable
ALTER TABLE "videos" DROP COLUMN "url";
