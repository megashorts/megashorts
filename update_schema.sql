-- CategoryType enum 업데이트
ALTER TYPE "CategoryType" ADD VALUE IF NOT EXISTS 'ADULT';
ALTER TYPE "CategoryType" ADD VALUE IF NOT EXISTS 'NOTIFICATION';
ALTER TYPE "CategoryType" ADD VALUE IF NOT EXISTS 'MSPOST';

-- AccessMethod enum 생성
CREATE TYPE "AccessMethod" AS ENUM ('FREE', 'SUBSCRIPTION', 'POINT_PAYMENT');

-- VideoViewAggregate 테이블 생성
CREATE TABLE "video_view_aggregates" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "subscriptionViews" INTEGER NOT NULL DEFAULT 0,
    "pointViews" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "video_view_aggregates_pkey" PRIMARY KEY ("id")
);

-- VideoViewAggregate 인덱스 및 제약조건 추가
CREATE UNIQUE INDEX "video_view_aggregates_videoId_date_key" ON "video_view_aggregates"("videoId", "date");
CREATE INDEX "video_view_aggregates_videoId_date_idx" ON "video_view_aggregates"("videoId", "date");
ALTER TABLE "video_view_aggregates" ADD CONSTRAINT "video_view_aggregates_videoId_fkey" 
    FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- InquiryType enum 생성
CREATE TYPE "InquiryType" AS ENUM ('REPORT', 'INQUIRY');

-- InquiryStatus enum 생성
CREATE TYPE "InquiryStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'CLOSED');

-- Inquiry 테이블 생성
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "type" "InquiryType" NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "postId" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'PENDING',
    "adminResponse" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- Inquiry 외래 키 제약조건 추가
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_postId_fkey" 
    FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- VideoView 테이블에 accessMethod 컬럼 추가
ALTER TABLE "video_views" ADD COLUMN IF NOT EXISTS "accessMethod" "AccessMethod" NOT NULL DEFAULT 'FREE';

-- VideoView 인덱스 추가
CREATE INDEX IF NOT EXISTS "video_views_videoId_accessMethod_createdAt_idx" ON "video_views"("videoId", "accessMethod", "createdAt");
