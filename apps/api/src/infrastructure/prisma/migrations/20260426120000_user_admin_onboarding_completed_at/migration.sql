-- AlterTable
ALTER TABLE "user" ADD COLUMN "admin_onboarding_completed_at" TIMESTAMP(3);

-- Existing accounts: treat as already onboarded (only new signups after this migration stay null).
UPDATE "user"
SET "admin_onboarding_completed_at" = COALESCE("updatedAt", "createdAt", NOW())
WHERE "admin_onboarding_completed_at" IS NULL;
