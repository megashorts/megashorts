-- AlterTable: 글로벌 성인인증을 위한 생년월일 및 인증 시각 필드 추가
ALTER TABLE "users" ADD COLUMN "birthDate" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "adultAuthAt" TIMESTAMP(3);
