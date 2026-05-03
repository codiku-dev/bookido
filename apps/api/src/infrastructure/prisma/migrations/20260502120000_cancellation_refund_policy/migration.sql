-- AlterTable
ALTER TABLE "user" ADD COLUMN "client_cancellation_refund_policy" TEXT NOT NULL DEFAULT 'HOURS_48';

-- AlterTable
ALTER TABLE "booking" ADD COLUMN "booking_pack_group_id" TEXT,
ADD COLUMN "stripe_checkout_session_id" TEXT,
ADD COLUMN "stripe_refunded_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "booking_ownerId_booking_pack_group_id_idx" ON "booking"("ownerId", "booking_pack_group_id");
