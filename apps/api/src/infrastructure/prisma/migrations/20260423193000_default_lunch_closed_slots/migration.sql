-- Default lunch break: 12:00–14:00 (30 min steps) for every day key, for hosts who never set availability.
UPDATE "user"
SET "calendarClosedSlotKeys" = '["mon-12:00","mon-12:30","mon-13:00","mon-13:30","tue-12:00","tue-12:30","tue-13:00","tue-13:30","wed-12:00","wed-12:30","wed-13:00","wed-13:30","thu-12:00","thu-12:30","thu-13:00","thu-13:30","fri-12:00","fri-12:30","fri-13:00","fri-13:30","sat-12:00","sat-12:30","sat-13:00","sat-13:30","sun-12:00","sun-12:30","sun-13:00","sun-13:30"]'::jsonb
WHERE "calendarClosedSlotKeys" IS NULL;
