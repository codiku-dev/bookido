-- Availability for admin calendar (weekly hours + manually closed slots)
ALTER TABLE "user" ADD COLUMN "calendarWeekHours" JSONB;
ALTER TABLE "user" ADD COLUMN "calendarClosedSlotKeys" JSONB;
