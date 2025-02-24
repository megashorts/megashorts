-- CreateTable
CREATE TABLE "NoticeModal" (
    "id" SERIAL NOT NULL,
    "priority" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "i18nData" JSONB NOT NULL,
    "linkUrl" TEXT,
    "buttonUrl" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoticeModal_pkey" PRIMARY KEY ("id")
);
