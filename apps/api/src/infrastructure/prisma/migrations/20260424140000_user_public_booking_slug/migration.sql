-- AlterTable
ALTER TABLE "user" ADD COLUMN "publicBookingSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_publicBookingSlug_key" ON "user"("publicBookingSlug");
