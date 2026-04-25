-- Alter user table with Stripe Connect onboarding fields
ALTER TABLE "user"
ADD COLUMN "stripeAccountId" TEXT,
ADD COLUMN "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "user_stripeAccountId_key" ON "user"("stripeAccountId");
