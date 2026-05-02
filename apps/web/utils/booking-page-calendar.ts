import { bookingLocalDateKey, totalMinutesToTimeHm } from "#/utils/booking-dates";
import {
  type CalendarDayKey,
  type CalendarWeekdayName,
  type WeekHours,
  buildCalendarSlotKey,
  getCalendarDayKeyFromDate,
  getContiguousBookableMinutesFromSlot,
  isOutsideBusinessHours,
  timeToMinutes,
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

/** Row starts for the public booking grid: one row every `slotStepMinutes` from 00:00 (trimmed by `computeVisibleTimeSlots`). */
export function buildPublicBookingGridSlotStarts(slotStepMinutes: number) {
  const step =
    Number.isFinite(slotStepMinutes) && slotStepMinutes >= 15 && slotStepMinutes <= 24 * 60 ? slotStepMinutes : 30;
  const out: string[] = [];
  for (let m = 0; m < 24 * 60; m += step) {
    out.push(totalMinutesToTimeHm(m));
  }
  return out;
}

function columnServiceStartIntervalBlocked(
  column: BookingPageDayColumn,
  rowStartHm: string,
  serviceDurationMinutes: number,
  weekHours: WeekHours,
  closedSlotKeys: Set<string>,
  occupiedSlotKeys: Set<string>,
) {
  const t0 = timeToMinutes(rowStartHm);
  const end = t0 + serviceDurationMinutes;
  for (let u = Math.floor(t0 / 30) * 30; u < end; u += 30) {
    const hm = totalMinutesToTimeHm(u);
    if (isOutsideBusinessHours(column.weekdayName, hm, weekHours)) {
      return true;
    }
    if (closedSlotKeys.has(buildCalendarSlotKey(column.dayKey, hm))) {
      return true;
    }
    if (occupiedSlotKeys.has(buildCalendarSlotKey(column.dayKey, hm))) {
      return true;
    }
  }
  return false;
}

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

/** All seven days of the week for the grid (includes closed days so “today” can still be highlighted). */
export type BookingPageWeekGridColumn = BookingPageDayColumn & { dayEnabled: boolean };

export function buildWeekGridColumns(weekDates: Date[], weekHours: WeekHours): BookingPageWeekGridColumn[] {
  return weekDates.map((date) => {
    const weekdayName = dayNames[date.getDay()] as CalendarWeekdayName;
    const dayEnabled = Boolean(weekHours[weekdayName]?.enabled);
    return {
      dayKey: getCalendarDayKeyFromDate(date),
      weekdayName,
      fullDate: date,
      dateIso: bookingLocalDateKey(date),
      dayEnabled,
    };
  });
}

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
  /** When set, row visibility follows a service window of this length (coarse grid). */
  serviceDurationMinutes?: number;
}) {
  if (p.enabledColumns.length === 0) {
    return [];
  }

  const isSlotClosed = (column: BookingPageDayColumn, time: string) => {
    const outside = isOutsideBusinessHours(column.weekdayName, time, p.weekHours);
    const slotKey = buildCalendarSlotKey(column.dayKey, time);
    return outside || p.closedSlotKeys.has(slotKey);
  };

  const rowIntervalHasOccupied = (time: string) => {
    const d = p.serviceDurationMinutes;
    if (!d) {
      return false;
    }
    const t0 = timeToMinutes(time);
    const end = t0 + d;
    return p.enabledColumns.some((column) => {
      for (let u = Math.floor(t0 / 30) * 30; u < end; u += 30) {
        const hm = totalMinutesToTimeHm(u);
        if (p.occupiedSlotKeys.has(buildCalendarSlotKey(column.dayKey, hm))) {
          return true;
        }
      }
      return false;
    });
  };

  const rowHasOpenSlot = (time: string) => {
    const durationMinutes = p.serviceDurationMinutes;
    if (durationMinutes) {
      return (
        p.enabledColumns.some(
          (column) =>
            !columnServiceStartIntervalBlocked(
              column,
              time,
              durationMinutes,
              p.weekHours,
              p.closedSlotKeys,
              p.occupiedSlotKeys,
            ),
        ) || rowIntervalHasOccupied(time)
      );
    }
    return (
      p.enabledColumns.some((column) => !isSlotClosed(column, time)) ||
      p.enabledColumns.some((column) => p.occupiedSlotKeys.has(buildCalendarSlotKey(column.dayKey, time)))
    );
  };

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
  /** Row step on the grid; when equal to `serviceDurationMinutes`, one row = one booking block. */
  gridSlotMinutes?: number;
  /** Extra blocked half-hour rows on this column (e.g. other pack sessions). */
  slotBlockedPredicate?: (slotTime: string) => boolean;
}) {
  const gridStep = p.gridSlotMinutes ?? 30;
  const intervalCheck =
    gridStep === p.serviceDurationMinutes && p.serviceDurationMinutes > 0 ? p.serviceDurationMinutes : undefined;
  const { contiguousMinutes } = getContiguousBookableMinutesFromSlot({
    column: { dayKey: p.column.dayKey, weekdayName: p.column.weekdayName },
    startTime: p.startTime,
    allTimeSlots: p.allTimeSlots as unknown as string[],
    slotMinutes: gridStep,
    weekHours: p.weekHours,
    closedSlotKeys: p.closedSlotKeys,
    intervalCheckMinutes: intervalCheck,
    hasBookingAtSlot: (dayKey, time) => {
      if (p.occupiedSlotKeys.has(buildCalendarSlotKey(dayKey, time))) {
        return true;
      }
      return p.slotBlockedPredicate?.(time) ?? false;
    },
  });
  return contiguousMinutes >= p.serviceDurationMinutes;
}

const DEFAULT_FIRST_SELECTABLE_SLOT_SCAN_WEEKS = 52;

/** First week (Mon-based, same as `getCalendarWeekDates`) that has at least one bookable slot; otherwise `null`. */
export function findFirstWeekAnchorWithSelectableSlot(p: {
  startWeekAnchor: Date;
  maxWeeks?: number;
  weekHours: WeekHours;
  closedSlotKeys: Set<string>;
  bookingSegments: { startsAt: string; durationMinutes: number; status: string }[];
  allTimeSlots: readonly string[];
  serviceDurationMinutes: number;
  minStartMs: number;
}): Date | null {
  const maxWeeks = p.maxWeeks ?? DEFAULT_FIRST_SELECTABLE_SLOT_SCAN_WEEKS;
  const monday0 = getCalendarWeekDates(p.startWeekAnchor)[0];
  if (!monday0) {
    return null;
  }
  for (let w = 0; w < maxWeeks; w += 1) {
    const weekMonday = new Date(monday0);
    weekMonday.setDate(monday0.getDate() + w * 7);
    const weekDates = getCalendarWeekDates(weekMonday);
    const occupiedKeys = buildOccupiedSlotKeySet(weekDates, p.bookingSegments);
    const enabledColumns = buildEnabledDayColumns(weekDates, p.weekHours);
    const visibleSlots = computeVisibleTimeSlots({
      enabledColumns,
      allTimeSlots: p.allTimeSlots,
      weekHours: p.weekHours,
      closedSlotKeys: p.closedSlotKeys,
      occupiedSlotKeys: occupiedKeys,
      serviceDurationMinutes: p.serviceDurationMinutes,
    });
    if (enabledColumns.length === 0 || visibleSlots.length === 0) {
      continue;
    }
    for (const col of enabledColumns) {
      for (const time of visibleSlots) {
        const startsAt = new Date(`${col.dateIso}T${time}:00`);
        if (startsAt.getTime() < p.minStartMs) {
          continue;
        }
        if (
          isSlotSelectableForService({
            column: col,
            startTime: time,
            serviceDurationMinutes: p.serviceDurationMinutes,
            allTimeSlots: p.allTimeSlots,
            weekHours: p.weekHours,
            closedSlotKeys: p.closedSlotKeys,
            occupiedSlotKeys: occupiedKeys,
            gridSlotMinutes: p.serviceDurationMinutes,
          })
        ) {
          return new Date(weekMonday.getFullYear(), weekMonday.getMonth(), weekMonday.getDate(), 12, 0, 0, 0);
        }
      }
    }
  }
  return null;
}
