/*
  Warnings:

  - You are about to drop the column `admin_onboarding_completed_at` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "admin_onboarding_completed_at",
ADD COLUMN     "adminOnboardingCompletedAt" TIMESTAMP(3);
