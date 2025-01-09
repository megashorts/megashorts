/*
  Warnings:

  - The `myLanguage` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mscoin" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "myLanguage",
ADD COLUMN     "myLanguage" "Language" NOT NULL DEFAULT 'KOREAN';
