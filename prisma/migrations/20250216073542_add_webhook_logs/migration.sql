/*
  Warnings:

  - The values [POINT_PAYMENT] on the enum `AccessMethod` will be removed. If these variants are still used in the database, this will fail.
  - The values [COMIC,PERIOD] on the enum `CategoryType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `timestamp` on the `video_views` table. All the data in the column will be lost.
  - You are about to drop the `BillingKey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.

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

-- DropForeignKey
ALTER TABLE "BillingKey" DROP CONSTRAINT "BillingKey_userId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- AlterTable
ALTER TABLE "video_views" DROP COLUMN "timestamp",
ADD COLUMN     "deleteSet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "BillingKey";

-- DropTable
DROP TABLE "Subscription";

-- CreateTable
CREATE TABLE "coin_usages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT,
    "recipientId" TEXT,
    "coins" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventMessage" TEXT,
    "type" TEXT NOT NULL DEFAULT 'VIDEO_VIEW',

    CONSTRAINT "coin_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "type" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "lastFailedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "billingKey" TEXT NOT NULL,
    "customerKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "cardCompany" TEXT,
    "cardNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coin_usages_userId_videoId_idx" ON "coin_usages"("userId", "videoId");

-- CreateIndex
CREATE INDEX "coin_usages_createdAt_idx" ON "coin_usages"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_status_currentPeriodEnd_idx" ON "subscriptions"("status", "currentPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "billing_keys_subscriptionId_key" ON "billing_keys"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_keys_billingKey_key" ON "billing_keys"("billingKey");

-- CreateIndex
CREATE INDEX "billing_keys_status_userId_idx" ON "billing_keys"("status", "userId");

-- AddForeignKey
ALTER TABLE "coin_usages" ADD CONSTRAINT "coin_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_usages" ADD CONSTRAINT "coin_usages_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_usages" ADD CONSTRAINT "coin_usages_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_keys" ADD CONSTRAINT "billing_keys_user_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_keys" ADD CONSTRAINT "billing_keys_subscription_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
