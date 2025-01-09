/*
  Warnings:

  - You are about to drop the column `adult` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "adultpost" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "adult",
ADD COLUMN     "adultauth" BOOLEAN NOT NULL DEFAULT false;
