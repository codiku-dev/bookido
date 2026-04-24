-- AlterTable
ALTER TABLE "user" ADD COLUMN "bookingsLastViewedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "booking" ADD COLUMN "createdByClient" BOOLEAN NOT NULL DEFAULT false;
