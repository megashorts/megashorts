-- CreateTable
CREATE TABLE "creator_info" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "country" TEXT,
    "swiftCode" TEXT,
    "paypalEmail" TEXT,
    "phoneNumber" TEXT,
    "address" TEXT,
    "extraInfo" JSONB,
    "idUrl" TEXT,
    "idCheck" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_info_userId_key" ON "creator_info"("userId");

-- AddForeignKey
ALTER TABLE "creator_info" ADD CONSTRAINT "creator_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
