-- New accounts start unpublished; existing rows stay live.
ALTER TABLE "user" ADD COLUMN "publicBookingSitePublished" BOOLEAN NOT NULL DEFAULT false;
UPDATE "user" SET "publicBookingSitePublished" = true;
