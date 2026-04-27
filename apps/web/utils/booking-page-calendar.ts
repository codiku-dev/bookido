import { bookingLocalDateKey, totalMinutesToTimeHm } from "#/utils/booking-dates";
import {
  type CalendarDayKey,
  type CalendarWeekdayName,
  type WeekHours,
  buildCalendarSlotKey,
  getCalendarDayKeyFromDate,
  getContiguousBookableMinutesFromSlot,
  isOutsideBusinessHours,
} from "#/utils/calendar-availability";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/** Half-hour grid used on admin calendar and public booking. */
export const BOOKING_PAGE_GRID_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
] as const;

export function getCalendarWeekDates(anchor: Date) {
  const currentDay = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - currentDay + (currentDay === 0 ? -6 : 1));

  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekDates.push(day);
  }
  return weekDates;
}

export type BookingPageDayColumn = {
  dayKey: CalendarDayKey;
  weekdayName: CalendarWeekdayName;
  fullDate: Date;
  dateIso: string;
};

export function buildEnabledDayColumns(weekDates: Date[], weekHours: WeekHours): BookingPageDayColumn[] {
  return weekDates
    .filter((date) => {
      const dayName = dayNames[date.getDay()] as CalendarWeekdayName;
      return weekHours[dayName]?.enabled;
    })
    .map((date) => {
      const dayKey = getCalendarDayKeyFromDate(date);
      const weekdayName = dayNames[date.getDay()] as CalendarWeekdayName;
      return {
        dayKey,
        weekdayName,
        fullDate: date,
        dateIso: bookingLocalDateKey(date),
      };
    });
}

export function buildOccupiedSlotKeySet(
  weekDates: Date[],
  segments: { startsAt: string; durationMinutes: number; status: string }[],
) {
  const slotMinutes = 30;
  const keys = new Set<string>();
  const weekDateKeys = new Set(weekDates.map((d) => bookingLocalDateKey(d)));
  for (const row of segments) {
    if (row.status === "cancelled") {
      continue;
    }
    const start = new Date(row.startsAt);
    const dateKey = bookingLocalDateKey(start);
    if (!weekDateKeys.has(dateKey)) {
      continue;
    }
    const dayKey = getCalendarDayKeyFromDate(start);
    const startTotal = start.getHours() * 60 + start.getMinutes();
    const aligned = Math.floor(startTotal / slotMinutes) * slotMinutes;
    const slotCount = Math.max(1, Math.ceil(row.durationMinutes / slotMinutes));
    for (let index = 0; index < slotCount; index++) {
      const slotTotal = aligned + index * slotMinutes;
      const currentTime = totalMinutesToTimeHm(slotTotal);
      keys.add(buildCalendarSlotKey(dayKey, currentTime));
    }
  }
  return keys;
}

export function computeVisibleTimeSlots(p: {
  enabledColumns: BookingPageDayColumn[];
  allTimeSlots: readonly string[];
  weekHours: WeekHours;
  closedSlotKeys: Set<string>;
  occupiedSlotKeys: Set<string>;
}) {
  if (p.enabledColumns.length === 0) {
    return [];
  }

  const isSlotClosed = (column: BookingPageDayColumn, time: string) => {
    const outside = isOutsideBusinessHours(column.weekdayName, time, p.weekHours);
    const slotKey = buildCalendarSlotKey(column.dayKey, time);
    return outside || p.closedSlotKeys.has(slotKey);
  };

  const rowHasOpenSlot = (time: string) =>
    p.enabledColumns.some((column) => !isSlotClosed(column, time)) ||
    p.enabledColumns.some((column) => p.occupiedSlotKeys.has(buildCalendarSlotKey(column.dayKey, time)));

  let first = 0;
  while (first < p.allTimeSlots.length) {
    const time = p.allTimeSlots[first];
    if (time === undefined || rowHasOpenSlot(time)) {
      break;
    }
    first++;
  }

  let last = p.allTimeSlots.length - 1;
  while (last >= first) {
    const time = p.allTimeSlots[last];
    if (time === undefined || rowHasOpenSlot(time)) {
      break;
    }
    last--;
  }

  if (first > last) {
    return [];
  }
  return p.allTimeSlots.slice(first, last + 1);
}

/** Half-hour cells covered by a booking starting at `dateIso` + `startTimeHm`, for overlap checks (same calendar day). */
export function collectDateIsoOccupiedHalfHours(p: {
  dateIso: string;
  startTimeHm: string;
  durationMinutes: number;
  slotMinutes?: number;
}) {
  const slotMinutes = p.slotMinutes ?? 30;
  const [hRaw, mRaw] = p.startTimeHm.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return new Set<string>();
  }
  const startTotal = h * 60 + m;
  const aligned = Math.floor(startTotal / slotMinutes) * slotMinutes;
  const slotCount = Math.max(1, Math.ceil(p.durationMinutes / slotMinutes));
  const keys = new Set<string>();
  for (let index = 0; index < slotCount; index += 1) {
    const slotTotal = aligned + index * slotMinutes;
    const hm = totalMinutesToTimeHm(slotTotal);
    keys.add(`${p.dateIso}|${hm}`);
  }
  return keys;
}

export function isSlotSelectableForService(p: {
  column: BookingPageDayColumn;
  startTime: string;
  serviceDurationMinutes: number;
  allTimeSlots: readonly string[];
  weekHours: WeekHours;
  closedSlotKeys: Set<string>;
  occupiedSlotKeys: Set<string>;
  /** Extra blocked half-hour rows on this column (e.g. other pack sessions). */
  slotBlockedPredicate?: (slotTime: string) => boolean;
}) {
  const { contiguousMinutes } = getContiguousBookableMinutesFromSlot({
    column: { dayKey: p.column.dayKey, weekdayName: p.column.weekdayName },
    startTime: p.startTime,
    allTimeSlots: p.allTimeSlots as unknown as string[],
    slotMinutes: 30,
    weekHours: p.weekHours,
    closedSlotKeys: p.closedSlotKeys,
    hasBookingAtSlot: (dayKey, time) => {
      if (p.occupiedSlotKeys.has(buildCalendarSlotKey(dayKey, time))) {
        return true;
      }
      return p.slotBlockedPredicate?.(time) ?? false;
    },
  });
  return contiguousMinutes >= p.serviceDurationMinutes;
}
