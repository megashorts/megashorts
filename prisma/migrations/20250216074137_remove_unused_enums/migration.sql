/*
  Warnings:

  - The values [POINT_PAYMENT] on the enum `AccessMethod` will be removed. If these variants are still used in the database, this will fail.
  - The values [COMIC,PERIOD] on the enum `CategoryType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AccessMethod_new" AS ENUM ('FREE', 'SUBSCRIPTION', 'COIN');
ALTER TABLE "video_views" ALTER COLUMN "accessMethod" DROP DEFAULT;
ALTER TABLE "video_views" ALTER COLUMN "accessMethod" TYPE "AccessMethod_new" USING ("accessMethod"::text::"AccessMethod_new");
ALTER TYPE "AccessMethod" RENAME TO "AccessMethod_old";
ALTER TYPE "AccessMethod_new" RENAME TO "AccessMethod";
DROP TYPE "AccessMethod_old";
ALTER TABLE "video_views" ALTER COLUMN "accessMethod" SET DEFAULT 'FREE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "CategoryType_new" AS ENUM ('COMEDY', 'ROMANCE', 'ACTION', 'THRILLER', 'DRAMA', 'PERIODPLAY', 'FANTASY', 'HIGHTEEN', 'ADULT', 'HUMANE', 'CALM', 'VARIETYSHOW', 'NOTIFICATION', 'MSPOST');
ALTER TABLE "posts" ALTER COLUMN "categories" TYPE "CategoryType_new"[] USING ("categories"::text::"CategoryType_new"[]);
ALTER TYPE "CategoryType" RENAME TO "CategoryType_old";
ALTER TYPE "CategoryType_new" RENAME TO "CategoryType";
DROP TYPE "CategoryType_old";
COMMIT;
