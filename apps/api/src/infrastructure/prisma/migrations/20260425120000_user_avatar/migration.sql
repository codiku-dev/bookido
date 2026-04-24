-- CreateTable
CREATE TABLE "user_avatar" (
    "user_id" TEXT NOT NULL,
    "image_data" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_avatar_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "user_avatar" ADD CONSTRAINT "user_avatar_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Move data-URL profile images off `user.image` (Better Auth serializes `user` on sign-in / get-session).
INSERT INTO "user_avatar" ("user_id", "image_data", "updated_at")
SELECT "id", "image", CURRENT_TIMESTAMP
FROM "user"
WHERE "image" IS NOT NULL
  AND "image" LIKE 'data:%';

UPDATE "user"
SET "image" = NULL
WHERE "image" IS NOT NULL
  AND "image" LIKE 'data:%';
