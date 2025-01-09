/*
  Warnings:

  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `categories_on_posts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "categories_on_posts" DROP CONSTRAINT "categories_on_posts_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "categories_on_posts" DROP CONSTRAINT "categories_on_posts_postId_fkey";

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "categories" "CategoryType"[];

-- DropTable
DROP TABLE "categories";

-- DropTable
DROP TABLE "categories_on_posts";
