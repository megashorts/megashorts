/*
  Warnings:

  - You are about to drop the `video_view_aggregates` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "video_view_aggregates" DROP CONSTRAINT "video_view_aggregates_videoId_fkey";

-- DropIndex
DROP INDEX "video_views_userId_createdAt_idx";

-- DropTable
DROP TABLE "video_view_aggregates";

-- CreateTable
CREATE TABLE "video_settlements" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "totalSubscriptionViews" INTEGER NOT NULL DEFAULT 0,
    "postSettlementSubViews" INTEGER NOT NULL DEFAULT 0,
    "totalCoinViews" INTEGER NOT NULL DEFAULT 0,
    "postSettlementCoinViews" INTEGER NOT NULL DEFAULT 0,
    "lastSettledAt" TIMESTAMP(3),

    CONSTRAINT "video_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement_histories" (
    "id" TEXT NOT NULL,
    "videoSettlementId" TEXT NOT NULL,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionViews" INTEGER NOT NULL,
    "coinViews" INTEGER NOT NULL,

    CONSTRAINT "settlement_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "video_settlements_lastSettledAt_idx" ON "video_settlements"("lastSettledAt");

-- CreateIndex
CREATE UNIQUE INDEX "video_settlements_videoId_key" ON "video_settlements"("videoId");

-- CreateIndex
CREATE INDEX "settlement_histories_videoSettlementId_settledAt_idx" ON "settlement_histories"("videoSettlementId", "settledAt");

-- AddForeignKey
ALTER TABLE "video_settlements" ADD CONSTRAINT "video_settlements_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_histories" ADD CONSTRAINT "settlement_histories_videoSettlementId_fkey" FOREIGN KEY ("videoSettlementId") REFERENCES "video_settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
