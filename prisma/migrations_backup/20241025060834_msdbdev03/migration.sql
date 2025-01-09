/*
  Warnings:

  - Changed the type of `code` on the `categories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('COMIC', 'ROMANCE', 'ACTION', 'THRILLER', 'DRAMA', 'PERIOD', 'FANTASY', 'HIGHTEEN');

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "code",
ADD COLUMN     "code" "CategoryType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");
