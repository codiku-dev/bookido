-- Repair DBs where an erroneous migration added "emailBookingNotificationsEnabled" (camelCase)
-- instead of Prisma's default "email_booking_notifications_enabled".
ALTER TABLE "user" DROP COLUMN IF EXISTS "emailBookingNotificationsEnabled";

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "email_booking_notifications_enabled" BOOLEAN NOT NULL DEFAULT true;
