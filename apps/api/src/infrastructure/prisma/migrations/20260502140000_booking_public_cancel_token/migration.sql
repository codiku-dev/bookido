-- AlterTable
ALTER TABLE "booking" ADD COLUMN "public_cancel_token" TEXT;
ALTER TABLE "booking" ADD COLUMN "public_cancel_token_expires_at" TIMESTAMP(3);

-- Unique when set (multiple NULLs allowed in PostgreSQL)
CREATE UNIQUE INDEX "booking_public_cancel_token_key" ON "booking"("public_cancel_token");
