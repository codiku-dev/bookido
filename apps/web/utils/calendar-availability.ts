import { totalMinutesToTimeHm } from "#/utils/booking-dates";

export type DayHours = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export const CALENDAR_WEEKDAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type CalendarWeekdayName = (typeof CALENDAR_WEEKDAY_ORDER)[number];

export type WeekHours = Record<CalendarWeekdayName, DayHours>;

export const DEFAULT_CALENDAR_WEEK_HOURS: WeekHours = {
  Monday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Tuesday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Wednesday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Thursday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Friday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Saturday: { enabled: false, startTime: "09:00", endTime: "18:00" },
  Sunday: { enabled: false, startTime: "09:00", endTime: "18:00" },
};

export const DAY_INDEX_TO_DAY_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export type CalendarDayKey = (typeof DAY_INDEX_TO_DAY_KEY)[number];

export function getCalendarDayKeyFromDate(date: Date): CalendarDayKey {
  const key = DAY_INDEX_TO_DAY_KEY[date.getDay()];
  return key ?? "mon";
}

export function buildCalendarSlotKey(dayKey: CalendarDayKey, time: string) {
  return `${dayKey}-${time}`;
}

const LUNCH_BREAK_DAY_KEYS: CalendarDayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** 12:00–14:00 (30‑min grid), all weekdays; matches server default closed slots. */
export const DEFAULT_LUNCH_BREAK_CLOSED_SLOT_KEYS: string[] = LUNCH_BREAK_DAY_KEYS.flatMap((dayKey) =>
  (["12:00", "12:30", "13:00", "13:30"] as const).map((time) => buildCalendarSlotKey(dayKey, time)),
);

export function timeToMinutes(timeValue: string) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function isOutsideBusinessHours(weekdayName: CalendarWeekdayName, time: string, hours: WeekHours) {
  const row = hours[weekdayName];
  if (!row || typeof row.enabled !== "boolean") {
    return true;
  }
  if (!row.enabled) {
    return true;
  }
  const slot = timeToMinutes(time);
  const start = timeToMinutes(row.startTime);
  const end = timeToMinutes(row.endTime);
  return slot < start || slot >= end;
}

export type CalendarSlotColumn = {
  dayKey: CalendarDayKey;
  weekdayName: CalendarWeekdayName;
};

/** Contiguous free window from `startTime` (30‑min grid): not outside hours, not manually closed, no booking. */
export function getContiguousBookableMinutesFromSlot(p: {
  column: CalendarSlotColumn;
  startTime: string;
  allTimeSlots: readonly string[];
  slotMinutes: number;
  weekHours: WeekHours;
  closedSlotKeys: Set<string>;
  hasBookingAtSlot: (dayKey: CalendarDayKey, time: string) => boolean;
}) {
  const isBlocked = (time: string) => {
    if (isOutsideBusinessHours(p.column.weekdayName, time, p.weekHours)) {
      return true;
    }
    if (p.closedSlotKeys.has(buildCalendarSlotKey(p.column.dayKey, time))) {
      return true;
    }
    if (p.hasBookingAtSlot(p.column.dayKey, time)) {
      return true;
    }
    return false;
  };

  const startIndex = p.allTimeSlots.indexOf(p.startTime);
  if (startIndex === -1 || isBlocked(p.startTime)) {
    return { contiguousMinutes: 0, nextUnavailableFrom: null as string | null, nextUnavailableTo: null as string | null };
  }

  let index = startIndex;
  let contiguousMinutes = 0;
  while (index < p.allTimeSlots.length) {
    const t = p.allTimeSlots[index];
    if (t === undefined || isBlocked(t)) {
      break;
    }
    contiguousMinutes += p.slotMinutes;
    index += 1;
  }

  if (index < p.allTimeSlots.length) {
    const from = p.allTimeSlots[index];
    if (from !== undefined) {
      const nextUnavailableTo = totalMinutesToTimeHm(timeToMinutes(from) + p.slotMinutes);
      return { contiguousMinutes, nextUnavailableFrom: from, nextUnavailableTo };
    }
  }

  return { contiguousMinutes, nextUnavailableFrom: null, nextUnavailableTo: null };
}
