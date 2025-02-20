-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "defaultValue" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "valueType" TEXT NOT NULL DEFAULT 'number';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "blockedUntil" TIMESTAMP(3),
ADD COLUMN     "loginAttempts" INTEGER NOT NULL DEFAULT 0;
