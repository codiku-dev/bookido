UPDATE "service"
SET "description" = 'Service description (dev)'
WHERE "description" IS NULL OR btrim("description") = '';

UPDATE "service"
SET "address" = '123 Demo Street, Paris'
WHERE "address" IS NULL OR btrim("address") = '';

ALTER TABLE "service"
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL;
