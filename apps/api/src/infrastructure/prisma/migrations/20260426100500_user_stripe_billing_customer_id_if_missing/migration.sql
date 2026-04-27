-- Heal drift: migration history can show applied while the column is missing (restore, branch DB, etc.).
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "stripeBillingCustomerId" TEXT;
