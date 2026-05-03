-- Idempotent: fixes local DBs stuck after the old migration folder was renamed (20260502180000 → 20260503100000).

DELETE FROM "_prisma_migrations" WHERE migration_name = '20260502180000_booking_client_reminder_24h';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'booking'
      AND column_name = 'client_reminder_24h_sent_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20260503100000_booking_client_reminder_24h'
  ) THEN
    DROP INDEX IF EXISTS "booking_client_reminder_lookup_idx";
    ALTER TABLE "booking" DROP COLUMN IF EXISTS "client_reminder_24h_sent_at";
  END IF;
END $$;
