-- Client reminder email (~24h before session); one send per booking row.
ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "client_reminder_24h_sent_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "booking_client_reminder_lookup_idx" ON "booking" ("status", "client_reminder_24h_sent_at", "startsAt");
