/*
  Warnings:

  - You are about to drop the `subtitles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "subtitles" DROP CONSTRAINT "subtitles_videoId_fkey";

-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "subtitle" "Language"[];

-- DropTable
DROP TABLE "subtitles";
