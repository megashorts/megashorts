/*
  Warnings:

  - Added the required column `title` to the `NoticeModal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "NoticeModal" ADD COLUMN     "hideOption" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "title" TEXT NOT NULL;
