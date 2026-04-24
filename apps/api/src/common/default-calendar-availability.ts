import type { Prisma } from "@api/generated/prisma/client";

/** Default admin / public booking week grid (Mon–Fri on, weekend off). */
export const DEFAULT_USER_CALENDAR_WEEK_HOURS = {
  Monday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Tuesday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Wednesday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Thursday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Friday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Saturday: { enabled: false, startTime: "09:00", endTime: "18:00" },
  Sunday: { enabled: false, startTime: "09:00", endTime: "18:00" },
} as const;

const LUNCH_DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/** 12:00–14:00 on the 30‑minute grid (exclusive of 14:00). */
const LUNCH_SLOT_TIMES = ["12:00", "12:30", "13:00", "13:30"] as const;

export function buildDefaultLunchClosedSlotKeys(): string[] {
  const keys: string[] = [];
  for (const dayKey of LUNCH_DAY_KEYS) {
    for (const time of LUNCH_SLOT_TIMES) {
      keys.push(`${dayKey}-${time}`);
    }
  }
  return keys;
}

export const DEFAULT_USER_CALENDAR_WEEK_HOURS_JSON = DEFAULT_USER_CALENDAR_WEEK_HOURS as unknown as Prisma.InputJsonValue;

export const DEFAULT_USER_CALENDAR_CLOSED_SLOT_KEYS_JSON = buildDefaultLunchClosedSlotKeys() as unknown as Prisma.InputJsonValue;
