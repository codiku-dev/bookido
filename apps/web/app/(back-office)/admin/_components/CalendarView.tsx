"use client";

import {
  useState,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  SquareArrowOutUpRight,
  CalendarClock,
  Trash2,
} from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@repo/trpc/router";
import ClientFormModal, { ClientFormData } from "#/components/ClientFormModal";
import BookingModal from "#/components/BookingModal";
import { Button } from "#/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "#/components/ui/context-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "#/components/ui/hover-card";
import { Popover, PopoverAnchor, PopoverContent } from "#/components/ui/popover";
import { trpc } from "@web/libs/trpc-client";
import { bookingLocalDateKey, totalMinutesToTimeHm } from "#/utils/booking-dates";
import { cn } from "@repo/ui/utils/cn";
import {
  DEFAULT_CALENDAR_WEEK_HOURS,
  type WeekHours,
  type CalendarDayKey,
  type CalendarWeekdayName,
  getCalendarDayKeyFromDate,
  buildCalendarSlotKey,
  timeToMinutes,
  isOutsideBusinessHours,
  getContiguousBookableMinutesFromSlot,
} from "#/utils/calendar-availability";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

function getWeekDates(date: Date) {
  const currentDay = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - currentDay + (currentDay === 0 ? -6 : 1));

  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekDates.push(day);
  }
  return weekDates;
}

function formatDate(date: Date) {
  const day = date.getDate();
  const monthLabel = monthNames[date.getMonth()] ?? "";
  const monthShort = monthLabel.substring(0, 3).toLowerCase();
  return `${day} ${monthShort}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const allTimeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
];

type BookingRow = inferRouterOutputs<AppRouter>["bookings"]["list"][number];

type CalendarCellBooking = {
  id: string;
  dayKey: CalendarDayKey;
  dateLabel: string;
  time: string;
  durationMinutes: number;
  client: string;
  email: string;
  phone: string;
  service: string;
  price: number;
  status: BookingRow["status"];
};

type EnabledDayColumn = {
  dayKey: CalendarDayKey;
  weekdayName: CalendarWeekdayName;
  shortLabel: string;
  date: string;
  fullDate: Date;
};

type AvailabilityDragState = {
  active: boolean;
  mode: "close" | "open" | null;
  keys: Set<string>;
};

type AvailabilityBookingConflictState = {
  rect: DOMRect;
  bookings: CalendarCellBooking[];
};

function formatBookingAvailabilityTimeRange(booking: CalendarCellBooking) {
  const startM = timeToMinutes(booking.time);
  return `${booking.time}–${totalMinutesToTimeHm(startM + booking.durationMinutes)}`;
}

function dedupeCalendarBookingsById(bookings: CalendarCellBooking[]) {
  const seen = new Set<string>();
  const out: CalendarCellBooking[] = [];
  for (const b of bookings) {
    if (seen.has(b.id)) {
      continue;
    }
    seen.add(b.id);
    out.push(b);
  }
  return out;
}

function CalendarSlotHoverHint(p: { label: string; children: ReactNode }) {
  return (
    <HoverCard openDelay={200} closeDelay={50}>
      <HoverCardTrigger asChild>
        <span className="block h-8 w-full max-w-full md:h-8 outline-none">{p.children}</span>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        sideOffset={6}
        className="max-w-[min(280px,85vw)] p-3 text-sm leading-snug"
      >
        {p.label}
      </HoverCardContent>
    </HoverCard>
  );
}

export type RescheduleSlotSelection = {
  dayKey: CalendarDayKey;
  dateLabel: string;
  dateIso: string;
  time: string;
};

export type CalendarViewProps = {
  mode?: "planning" | "reschedule";
  rescheduleBookingId?: string;
  rescheduleAnchorDate?: Date | string | null;
  onRescheduleSlotSelect?: (slot: RescheduleSlotSelection) => void;
};

export default function CalendarView(p: CalendarViewProps = {}) {
  const mode = p.mode ?? "planning";
  const rescheduleBookingId = p.rescheduleBookingId;
  const rescheduleAnchorDate = p.rescheduleAnchorDate;
  const onRescheduleSlotSelect = p.onRescheduleSlotSelect;

  const t = useTranslations();
  const router = useRouter();
  const utils = trpc.useUtils();
  const today = new Date();
  const hydratedRef = useRef(false);
  const [calendarReady, setCalendarReady] = useState(false);

  const availabilityQuery = trpc.profile.getCalendarAvailability.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  const updateAvailabilityMutation = trpc.profile.updateCalendarAvailability.useMutation({
    onError: () => {
      toast.error(t("calendar.availability.saveError"));
    },
  });

  const [closedSlotKeys, setClosedSlotKeys] = useState<string[]>([]);
  const [isAvailabilityMode, setIsAvailabilityMode] = useState(false);
  const [weekHours, setWeekHours] = useState<WeekHours>(DEFAULT_CALENDAR_WEEK_HOURS);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    dayKey: CalendarDayKey;
    dateLabel: string;
    dateIso: string;
    time: string;
  } | null>(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [postCreateClientId, setPostCreateClientId] = useState<string | null>(null);
  const resumeBookingAfterClientRef = useRef(false);

  const clearPostCreateClientId = useCallback(() => {
    setPostCreateClientId(null);
  }, []);
  const [hoveredBookingId, setHoveredBookingId] = useState<string | null>(null);
  const [bookingPendingDelete, setBookingPendingDelete] = useState<{
    id: string;
    client: string;
    service: string;
  } | null>(null);
  const [availabilityBookingConflict, setAvailabilityBookingConflict] =
    useState<AvailabilityBookingConflictState | null>(null);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const rescheduleAnchorAppliedRef = useRef(false);

  useEffect(() => {
    if (mode !== "reschedule" || rescheduleAnchorAppliedRef.current) {
      return;
    }
    if (rescheduleAnchorDate === null || rescheduleAnchorDate === undefined) {
      return;
    }
    const anchor =
      rescheduleAnchorDate instanceof Date ? rescheduleAnchorDate : new Date(rescheduleAnchorDate);
    if (Number.isNaN(anchor.getTime())) {
      return;
    }
    setCurrentDate(new Date(anchor));
    setSelectedMonth(anchor.getMonth());
    setSelectedYear(anchor.getFullYear());
    rescheduleAnchorAppliedRef.current = true;
  }, [mode, rescheduleAnchorDate]);

  useEffect(() => {
    if (availabilityQuery.data && !hydratedRef.current) {
      setWeekHours(availabilityQuery.data.weekHours as WeekHours);
      setClosedSlotKeys([...availabilityQuery.data.closedSlotKeys]);
      hydratedRef.current = true;
    }
    if (availabilityQuery.data || availabilityQuery.isError) {
      setCalendarReady(true);
    }
  }, [availabilityQuery.data, availabilityQuery.isError]);

  const closedSet = useMemo(() => new Set(closedSlotKeys), [closedSlotKeys]);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const bookingListInput = useMemo(() => {
    const d0 = weekDates[0]!;
    const d6 = weekDates[6]!;
    const from = new Date(d0);
    from.setHours(0, 0, 0, 0);
    const to = new Date(d6);
    to.setHours(23, 59, 59, 999);
    return { rangeFrom: from.toISOString(), rangeTo: to.toISOString() };
  }, [weekDates]);

  const bookingsListQuery = trpc.bookings.list.useQuery(bookingListInput, {
    enabled: calendarReady,
    retry: false,
  });

  const servicesQuery = trpc.services.list.useQuery(undefined, {
    enabled: calendarReady && mode === "planning",
    retry: false,
  });

  const clientsQuery = trpc.clients.list.useQuery(undefined, {
    enabled: calendarReady && mode === "planning",
    retry: false,
  });

  const createBookingMutation = trpc.bookings.create.useMutation({
    onSuccess: async () => {
      toast.success(t("calendar.toast.bookingCreated"));
      await utils.bookings.list.invalidate();
      setPostCreateClientId(null);
      setShowBookingModal(false);
      setSelectedSlot(null);
    },
    onError: () => {
      toast.error(t("calendar.toast.bookingCreateError"));
    },
  });

  const deleteBookingMutation = trpc.bookings.delete.useMutation({
    onSuccess: async () => {
      toast.success(t("calendar.toast.bookingDeleted"));
      await utils.bookings.list.invalidate();
      setBookingPendingDelete(null);
    },
    onError: () => {
      toast.error(t("calendar.toast.bookingDeleteError"));
      setBookingPendingDelete(null);
    },
  });

  const createClientMutation = trpc.clients.create.useMutation({
    onSuccess: async (created) => {
      toast.success(t("calendar.toast.clientCreated"));
      await utils.clients.list.invalidate();
      const resumeBooking = resumeBookingAfterClientRef.current;
      resumeBookingAfterClientRef.current = false;
      if (resumeBooking) {
        setPostCreateClientId(created.id);
        setShowBookingModal(true);
      }
      setShowNewClientModal(false);
    },
    onError: () => {
      toast.error(t("calendar.toast.clientCreateError"));
    },
  });

  const firstDay = weekDates[0]!;
  const lastDay = weekDates[6]!;
  const currentWeekDisplay = `${firstDay.getDate()} - ${lastDay.getDate()} ${monthNames[lastDay.getMonth()] ?? ""} ${lastDay.getFullYear()}`;

  const slotMinutes = 30;

  const bookingBySlot = useMemo(() => {
    const map = new Map<string, { booking: CalendarCellBooking; isContinuation: boolean }>();
    const weekDateKeys = new Set(weekDates.map((d) => bookingLocalDateKey(d)));
    const rows = bookingsListQuery.data ?? [];
    for (const row of rows) {
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
      const cell: CalendarCellBooking = {
        id: row.id,
        dayKey,
        dateLabel: formatDate(start),
        time: totalMinutesToTimeHm(aligned),
        durationMinutes: row.durationMinutes,
        client: row.clientName,
        email: row.clientEmail,
        phone: row.clientPhone,
        service: row.serviceName,
        price: row.price,
        status: row.status,
      };
      for (let index = 0; index < slotCount; index++) {
        const slotTotal = aligned + index * slotMinutes;
        const currentTime = totalMinutesToTimeHm(slotTotal);
        map.set(`${dayKey}-${currentTime}`, { booking: cell, isContinuation: index > 0 });
      }
    }
    return map;
  }, [bookingsListQuery.data, weekDates]);

  const bookingSlotBookability = useMemo(() => {
    if (!selectedSlot || mode !== "planning") {
      return null;
    }
    for (const date of weekDates) {
      const weekdayName = dayNames[date.getDay()] as CalendarWeekdayName;
      if (!weekHours[weekdayName]?.enabled) {
        continue;
      }
      const dayKey = getCalendarDayKeyFromDate(date);
      if (dayKey !== selectedSlot.dayKey) {
        continue;
      }
      if (bookingLocalDateKey(date) !== selectedSlot.dateIso) {
        continue;
      }
      return getContiguousBookableMinutesFromSlot({
        column: { dayKey, weekdayName },
        startTime: selectedSlot.time,
        allTimeSlots,
        slotMinutes,
        weekHours,
        closedSlotKeys: closedSet,
        hasBookingAtSlot: (dk, t) => bookingBySlot.has(`${dk}-${t}`),
      });
    }
    return null;
  }, [selectedSlot, mode, weekDates, weekHours, closedSet, bookingBySlot]);

  const isSlotClosed = (column: EnabledDayColumn, time: string) => {
    const outside = isOutsideBusinessHours(column.weekdayName, time, weekHours);
    const slotKey = buildCalendarSlotKey(column.dayKey, time);
    return outside || closedSet.has(slotKey);
  };

  const availabilityDragRef = useRef<AvailabilityDragState>({
    active: false,
    mode: null,
    keys: new Set(),
  });

  const resetAvailabilityDrag = () => {
    availabilityDragRef.current = { active: false, mode: null, keys: new Set() };
  };

  useEffect(() => {
    const onGlobalPointerUp = () => {
      resetAvailabilityDrag();
    };
    window.addEventListener("pointerup", onGlobalPointerUp);
    window.addEventListener("pointercancel", onGlobalPointerUp);
    return () => {
      window.removeEventListener("pointerup", onGlobalPointerUp);
      window.removeEventListener("pointercancel", onGlobalPointerUp);
    };
  }, []);

  useEffect(() => {
    if (!isAvailabilityMode) {
      resetAvailabilityDrag();
    }
  }, [isAvailabilityMode]);

  useEffect(() => {
    if (!isAvailabilityMode) {
      setAvailabilityBookingConflict(null);
    }
  }, [isAvailabilityMode]);

  const paintAvailabilitySlot = (column: EnabledDayColumn, time: string, shouldClose: boolean) => {
    if (!isAvailabilityMode) {
      return;
    }
    if (isOutsideBusinessHours(column.weekdayName, time, weekHours)) {
      return;
    }
    const slotKey = buildCalendarSlotKey(column.dayKey, time);
    setClosedSlotKeys((previous) => {
      const next = new Set(previous);
      if (shouldClose) {
        next.add(slotKey);
      } else {
        next.delete(slotKey);
      }
      return [...next];
    });
  };

  const handleAvailabilityPaintPointerDown = (
    column: EnabledDayColumn,
    time: string,
    event: PointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0) {
      return;
    }
    if (!isAvailabilityMode) {
      return;
    }
    if (bookingBySlot.has(`${column.dayKey}-${time}`)) {
      return;
    }
    if (isOutsideBusinessHours(column.weekdayName, time, weekHours)) {
      return;
    }
    event.preventDefault();
    const slotKey = buildCalendarSlotKey(column.dayKey, time);
    const currentlyManuallyClosed = closedSet.has(slotKey);
    const mode: "close" | "open" = currentlyManuallyClosed ? "open" : "close";
    availabilityDragRef.current = {
      active: true,
      mode,
      keys: new Set([slotKey]),
    };
    paintAvailabilitySlot(column, time, mode === "close");
  };

  const handleAvailabilityDragHitBookedSlot = (
    column: EnabledDayColumn,
    time: string,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    const drag = availabilityDragRef.current;
    if (!drag.active || drag.mode !== "close") {
      return;
    }
    const key = buildCalendarSlotKey(column.dayKey, time);
    const entry = bookingBySlot.get(key);
    if (!entry) {
      return;
    }
    setAvailabilityBookingConflict({
      rect: event.currentTarget.getBoundingClientRect(),
      bookings: dedupeCalendarBookingsById([entry.booking]),
    });
    resetAvailabilityDrag();
  };

  const handleAvailabilityPaintMouseEnter = (column: EnabledDayColumn, time: string) => {
    const { active, mode, keys } = availabilityDragRef.current;
    if (!active || !mode) {
      return;
    }
    if (bookingBySlot.has(buildCalendarSlotKey(column.dayKey, time))) {
      return;
    }
    if (isOutsideBusinessHours(column.weekdayName, time, weekHours)) {
      return;
    }
    const slotKey = buildCalendarSlotKey(column.dayKey, time);
    if (keys.has(slotKey)) {
      return;
    }
    keys.add(slotKey);
    paintAvailabilitySlot(column, time, mode === "close");
  };

  const toggleSlotAvailability = (column: EnabledDayColumn, time: string) => {
    if (!isAvailabilityMode) {
      return;
    }
    if (bookingBySlot.has(`${column.dayKey}-${time}`)) {
      return;
    }
    if (isOutsideBusinessHours(column.weekdayName, time, weekHours)) {
      return;
    }
    const slotKey = buildCalendarSlotKey(column.dayKey, time);
    setClosedSlotKeys((previous) => {
      const next = new Set(previous);
      if (next.has(slotKey)) {
        next.delete(slotKey);
      } else {
        next.add(slotKey);
      }
      return [...next];
    });
  };

  const toggleDayHours = (day: CalendarWeekdayName) => {
    setWeekHours({
      ...weekHours,
      [day]: { ...weekHours[day], enabled: !weekHours[day].enabled },
    });
  };

  const updateDayTime = (day: CalendarWeekdayName, field: "startTime" | "endTime", value: string) => {
    setWeekHours({
      ...weekHours,
      [day]: { ...weekHours[day], [field]: value },
    });
  };

  const handleSlotClick = (
    column: EnabledDayColumn,
    time: string,
    booking?: CalendarCellBooking,
    isClosed?: boolean,
    anchorEvent?: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (isAvailabilityMode) {
      if (booking) {
        if (anchorEvent) {
          setAvailabilityBookingConflict({
            rect: (anchorEvent.currentTarget as HTMLElement).getBoundingClientRect(),
            bookings: dedupeCalendarBookingsById([booking]),
          });
        }
        return;
      }
      toggleSlotAvailability(column, time);
    } else if (mode === "reschedule") {
      if (booking) {
        if (rescheduleBookingId && booking.id === rescheduleBookingId) {
          if (!isClosed && onRescheduleSlotSelect) {
            onRescheduleSlotSelect({
              dayKey: column.dayKey,
              dateLabel: column.date,
              dateIso: bookingLocalDateKey(column.fullDate),
              time,
            });
          }
          return;
        }
        return;
      }
      if (!isClosed && onRescheduleSlotSelect) {
        onRescheduleSlotSelect({
          dayKey: column.dayKey,
          dateLabel: column.date,
          dateIso: bookingLocalDateKey(column.fullDate),
          time,
        });
      }
    } else if (booking) {
      router.push(`/admin/bookings/${booking.id}`);
    } else if (!isClosed) {
      setSelectedSlot({
        dayKey: column.dayKey,
        dateLabel: column.date,
        dateIso: bookingLocalDateKey(column.fullDate),
        time,
      });
      setShowBookingModal(true);
    }
  };

  const handleSaveNewClient = (clientData: ClientFormData) => {
    createClientMutation.mutate({
      name: clientData.name.trim(),
      email: clientData.email.trim(),
      phone: clientData.phone.trim(),
      address: clientData.address?.trim() || undefined,
      notes: clientData.notes?.trim() || undefined,
    });
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentDate(newDate);
    setSelectedMonth(newDate.getMonth());
    setSelectedYear(newDate.getFullYear());
  };

  const goToToday = () => {
    const next = new Date();
    setCurrentDate(next);
    setSelectedMonth(next.getMonth());
    setSelectedYear(next.getFullYear());
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    const newDate = new Date(selectedYear, month, 1);
    setCurrentDate(newDate);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    const newDate = new Date(year, selectedMonth, 1);
    setCurrentDate(newDate);
  };

  const weekdayI18nKey = (dayName: string) => `calendar.weekday.${dayName.toLowerCase()}`;

  const enabledDays: EnabledDayColumn[] = weekDates
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
        shortLabel: t(`public.time.days.${dayKey}.short`),
        date: formatDate(date),
        fullDate: date,
      };
    });

  const visibleTimeSlots =
    enabledDays.length === 0
      ? []
      : (() => {
          const rowHasOpenSlot = (time: string) =>
            enabledDays.some((column) => !isSlotClosed(column, time)) ||
            enabledDays.some((column) => bookingBySlot.has(`${column.dayKey}-${time}`));

          let first = 0;
          while (first < allTimeSlots.length) {
            const time = allTimeSlots[first];
            if (time === undefined || rowHasOpenSlot(time)) {
              break;
            }
            first++;
          }

          let last = allTimeSlots.length - 1;
          while (last >= first) {
            const time = allTimeSlots[last];
            if (time === undefined || rowHasOpenSlot(time)) {
              break;
            }
            last--;
          }

          if (first > last) {
            return [];
          }
          return allTimeSlots.slice(first, last + 1);
        })();

  const handleAvailabilityModeClick = async () => {
    if (!isAvailabilityMode) {
      setIsAvailabilityMode(true);
      return;
    }
    try {
      await updateAvailabilityMutation.mutateAsync({
        weekHours,
        closedSlotKeys,
      });
      toast.success(t("calendar.availability.saved"));
      await utils.profile.getCalendarAvailability.invalidate();
      setIsAvailabilityMode(false);
    } catch {
      /* toast in mutation onError */
    }
  };

  const savingAvailability = updateAvailabilityMutation.isPending;

  const handleBookingCellEnter = (bookingId: string) => {
    setHoveredBookingId(bookingId);
  };

  const handleBookingCellLeave = (bookingId: string, event: MouseEvent<HTMLButtonElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && typeof (next as Element).closest === "function") {
      const el = next as Element;
      if (el.closest(`[data-booking-cell="${bookingId}"]`)) {
        return;
      }
    }
    setHoveredBookingId((previous) => (previous === bookingId ? null : previous));
  };

  const loadingBlock = (
    <div className="flex flex-1 items-center justify-center p-16">
      <p className="text-slate-600">{t("calendar.availability.loading")}</p>
    </div>
  );

  const availabilityToolbar = (
    <div className="flex gap-3">
      <Button
        type="button"
        disabled={savingAvailability || (!calendarReady && !availabilityQuery.isError)}
        onClick={() => void handleAvailabilityModeClick()}
        className={`h-11 px-6 rounded-xl ${
          isAvailabilityMode
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        <CalendarIcon className="w-5 h-5" />
        {isAvailabilityMode
          ? t("calendar.exit.availability")
          : t("calendar.define.availability")}
      </Button>
    </div>
  );

  const openingHoursEditorRows = isAvailabilityMode ? (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-4">{t("calendar.hours.opening")}</h3>
      <div className="space-y-3">
        {(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const).map((day) => (
          <div key={day} className={`p-3 rounded-xl bg-white border ${weekHours[day].enabled ? "border-blue-100" : "border-slate-100"}`}>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-3 min-w-[120px]">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weekHours[day].enabled}
                    onChange={() => toggleDayHours(day)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:inset-s-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className="font-medium text-slate-900 text-sm">{t(weekdayI18nKey(day))}</span>
              </div>

              {weekHours[day].enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={weekHours[day].startTime}
                    onChange={(e) => updateDayTime(day, "startTime", e.target.value)}
                    className="px-2 py-1 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {allTimeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <span className="text-slate-400">→</span>
                  <select
                    value={weekHours[day].endTime}
                    onChange={(e) => updateDayTime(day, "endTime", e.target.value)}
                    className="px-2 py-1 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {allTimeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-slate-500 italic text-sm">{t("calendar.hours.closed")}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const modalServices = useMemo(
    () =>
      (servicesQuery.data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
        price: s.price,
        imageUrl: s.imageUrl,
      })),
    [servicesQuery.data],
  );

  const modalClients = useMemo(
    () =>
      (clientsQuery.data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
      })),
    [clientsQuery.data],
  );

  const calendarGrid = (
    <div
      className={cn(
        "p-2 md:p-3",
        isAvailabilityMode
          ? "rounded-xl bg-white border border-blue-100 shadow-sm ring-1 ring-blue-100/40 select-none"
          : "rounded-2xl bg-white border border-slate-200 shadow-lg",
      )}
    >
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${enabledDays.length * 72 + 48}px` }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: `48px repeat(${enabledDays.length}, 1fr)`,
            gap: "1px",
            backgroundColor: "#e2e8f0",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            overflow: "hidden",
          }}>
            <div className="bg-slate-50"></div>
            {enabledDays.map((day) => {
              const isTodayColumnHeader = isSameDay(day.fullDate, today);
              return (
                <div
                  key={day.dayKey}
                  className={`bg-slate-50 p-1.5 text-center ${
                    isTodayColumnHeader
                      ? "border-l-2 border-r-2 border-t-2 border-blue-700"
                      : ""
                  }`}
                >
                  <div className="font-medium text-slate-900 text-xs md:text-sm">{day.shortLabel}</div>
                  {!isAvailabilityMode && (
                    <div className="mt-0.5">
                      {isSameDay(day.fullDate, today) ? (
                        <span className="inline-flex px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] md:text-xs font-medium">
                          {day.date}
                        </span>
                      ) : (
                        <span className="text-[10px] md:text-xs text-slate-500">{day.date}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {visibleTimeSlots.map((time, slotIndex) => {
              const isLastVisibleSlot = slotIndex === visibleTimeSlots.length - 1;
              return (
              <Fragment key={time}>
                <div className="bg-white px-1.5 h-8 md:h-8 flex items-center justify-end">
                  <span className="text-[10px] md:text-xs text-slate-600">{time}</span>
                </div>
                {enabledDays.map((column) => {
                  const isTodayColumn = isSameDay(column.fullDate, today);
                  const slotBooking = bookingBySlot.get(`${column.dayKey}-${time}`);
                  const booking = slotBooking?.booking;
                  const isContinuation = slotBooking?.isContinuation ?? false;
                  const closed = isSlotClosed(column, time);
                  const outsideOnly = isOutsideBusinessHours(column.weekdayName, time, weekHours);
                  const toggleDisabled = isAvailabilityMode && outsideOnly;
                  const isOutsideClosedCell = closed && !booking && outsideOnly;
                  const isManualClosedCell = closed && !booking && !outsideOnly;
                  const paintableAvailability = isAvailabilityMode && !booking && !outsideOnly;
                  const bookingHovered = Boolean(booking && hoveredBookingId === booking.id);

                  const isRescheduleSource =
                    mode === "reschedule" &&
                    Boolean(rescheduleBookingId) &&
                    booking != null &&
                    booking.id === rescheduleBookingId;

                  const slotCellClassName = `group w-full p-1 h-8 md:h-8 box-border transition-all text-left relative disabled:cursor-not-allowed ${
                    closed && !booking
                      ? isOutsideClosedCell
                        ? "bg-slate-400 cursor-not-allowed hover:bg-slate-400 disabled:opacity-100"
                        : isAvailabilityMode
                          ? "bg-slate-100 cursor-pointer hover:bg-slate-200"
                          : "bg-slate-100 cursor-not-allowed"
                      : isAvailabilityMode
                        ? "bg-white hover:bg-slate-50 cursor-pointer"
                        : booking
                          ? isRescheduleSource
                            ? booking.status === "confirmed"
                              ? `${bookingHovered ? "bg-blue-100" : "bg-blue-50"} opacity-[0.72] border border-dotted border-blue-600 cursor-pointer`
                              : booking.status === "pending"
                                ? `${bookingHovered ? "bg-yellow-100" : "bg-yellow-50"} opacity-[0.72] border border-dotted border-yellow-600 cursor-pointer`
                                : `${bookingHovered ? "bg-red-100" : "bg-red-50"} opacity-[0.72] border border-dotted border-red-600 cursor-pointer`
                            : booking.status === "confirmed"
                              ? `${bookingHovered ? "bg-blue-100" : "bg-blue-50"} hover:bg-blue-100 border-l-2 border-blue-600 cursor-pointer`
                              : booking.status === "pending"
                                ? `${bookingHovered ? "bg-yellow-100" : "bg-yellow-50"} hover:bg-yellow-100 border-l-2 border-yellow-600 cursor-pointer`
                                : `${bookingHovered ? "bg-red-100" : "bg-red-50"} hover:bg-red-100 border-l-2 border-red-600 cursor-pointer`
                          : "bg-white hover:bg-slate-50 cursor-pointer"
                  }`;

                  const slotCellBody = (
                    <>
                      {isManualClosedCell ? (
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `repeating-linear-gradient(
                              45deg,
                              transparent,
                              transparent 10px,
                              #cbd5e1 10px,
                              #cbd5e1 11px
                            )`,
                            backgroundColor: "#f1f5f9",
                          }}
                        />
                      ) : null}
                      {!isAvailabilityMode && booking && !isContinuation && (
                        <div className="text-[10px] relative z-10 leading-tight">
                          <div className="font-medium text-slate-900 truncate">
                            {booking.client}
                          </div>
                          <div className="text-slate-600 truncate text-[9px]">{booking.service}</div>
                        </div>
                      )}
                      {!isAvailabilityMode && booking && isContinuation && (
                        <>
                          <div
                            className={`absolute -top-px left-0 right-0 h-px ${
                              booking.status === "confirmed"
                                ? bookingHovered ? "bg-blue-100" : "bg-blue-50"
                                : booking.status === "pending"
                                  ? bookingHovered ? "bg-yellow-100" : "bg-yellow-50"
                                  : bookingHovered ? "bg-red-100" : "bg-red-50"
                            }`}
                          />
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 font-medium">
                            •
                          </div>
                        </>
                      )}
                      {!isAvailabilityMode && !booking && !closed && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            {mode === "reschedule" ? (
                              <CalendarClock className="size-2.5" strokeWidth={2.5} aria-hidden />
                            ) : (
                              <span className="text-xs font-bold leading-none">+</span>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );

                  const slotInteractiveCore = paintableAvailability ? (
                    <div
                      role="button"
                      tabIndex={0}
                      className={`${slotCellClassName} select-none touch-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1`}
                      onPointerDown={(event) => handleAvailabilityPaintPointerDown(column, time, event)}
                      onMouseEnter={() => handleAvailabilityPaintMouseEnter(column, time)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleSlotAvailability(column, time);
                        }
                      }}
                    >
                      {slotCellBody}
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={toggleDisabled}
                      data-booking-cell={booking ? booking.id : undefined}
                      onMouseEnter={
                        booking
                          ? (e) => {
                              handleBookingCellEnter(booking.id);
                              if (isAvailabilityMode) {
                                handleAvailabilityDragHitBookedSlot(column, time, e);
                              }
                            }
                          : undefined
                      }
                      onMouseLeave={booking ? (e) => handleBookingCellLeave(booking.id, e) : undefined}
                      onClick={(e) => handleSlotClick(column, time, booking, closed, e)}
                      className={slotCellClassName}
                    >
                      {slotCellBody}
                    </button>
                  );

                  const isRescheduleOpenSlot =
                    mode === "reschedule" && !isAvailabilityMode && !booking && !closed;

                  const manualClosedHoverHint =
                    isManualClosedCell && !isAvailabilityMode ? (
                      <CalendarSlotHoverHint label={t("calendar.availability.manualClosedSlotHint")}>
                        {slotInteractiveCore}
                      </CalendarSlotHoverHint>
                    ) : null;

                  const slotButton = isOutsideClosedCell ? (
                    <CalendarSlotHoverHint label={t("calendar.hours.outsideSlotHint")}>
                      {slotInteractiveCore}
                    </CalendarSlotHoverHint>
                  ) : manualClosedHoverHint !== null ? (
                    manualClosedHoverHint
                  ) : isRescheduleOpenSlot ? (
                    <CalendarSlotHoverHint label={t("calendar.rescheduleMode.openSlotHover")}>
                      {slotInteractiveCore}
                    </CalendarSlotHoverHint>
                  ) : (
                    slotInteractiveCore
                  );

                  const contextMenuForBooking =
                    !isAvailabilityMode && booking && mode !== "reschedule" ? (
                      <ContextMenuContent className="min-w-[10rem]">
                        <ContextMenuItem
                          className="gap-2"
                          onSelect={() => {
                            router.push(`/admin/bookings/${booking.id}`);
                          }}
                        >
                          <SquareArrowOutUpRight className="size-4" />
                          {t("calendar.contextMenu.open")}
                        </ContextMenuItem>
                        <ContextMenuItem
                          className="gap-2"
                          onSelect={() => {
                            router.push(
                              `/admin/bookings/${booking.id}/reschedule?returnTo=${encodeURIComponent("/admin/calendar")}`,
                            );
                          }}
                        >
                          <CalendarClock className="size-4" />
                          {t("calendar.contextMenu.reschedule")}
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          variant="destructive"
                          className="gap-2"
                          onSelect={() => {
                            setBookingPendingDelete({
                              id: booking.id,
                              client: booking.client,
                              service: booking.service,
                            });
                          }}
                        >
                          <Trash2 className="size-4" />
                          {t("calendar.contextMenu.delete")}
                        </ContextMenuItem>
                      </ContextMenuContent>
                    ) : null;

                  const todayBottomCap =
                    isTodayColumn && isLastVisibleSlot ? (
                      <div className="h-0.5 w-full shrink-0 bg-blue-700" aria-hidden />
                    ) : null;

                  const todayColumnCellShell = (
                    <div
                      className={`flex h-8 md:h-8 w-full min-h-0 flex-col box-border${
                        isTodayColumn ? " border-l-2 border-r-2 border-blue-700" : ""
                      }`}
                    >
                      <div className="min-h-0 flex-1 overflow-hidden">{slotButton}</div>
                      {todayBottomCap}
                    </div>
                  );

                  return (
                    <ContextMenu key={`${column.dayKey}-${time}`}>
                      <ContextMenuTrigger asChild>{todayColumnCellShell}</ContextMenuTrigger>
                      {contextMenuForBooking}
                    </ContextMenu>
                  );
                })}
              </Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  if (!calendarReady) {
    if (mode === "reschedule") {
      return (
        <div className="flex flex-1 items-center justify-center p-16 min-h-[200px]">
          <p className="text-slate-600">{t("calendar.availability.loading")}</p>
        </div>
      );
    }
    return (
      <div className="h-full flex flex-col">
        <div className="p-8 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("calendar.title")}</h1>
            <p className="text-slate-600">{t("calendar.subtitle")}</p>
          </div>
        </div>
        {loadingBlock}
      </div>
    );
  }

  const weekNavigation = (
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigateWeek("prev")}
                  className="hover:bg-slate-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="font-medium text-slate-900 min-w-[200px] text-center">{currentWeekDisplay}</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigateWeek("next")}
                  className="hover:bg-slate-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
              >
                {monthNames.map((month, index) => (
                  <option key={month} value={index}>{month}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
              >
                {Array.from({ length: 10 }, (_, i) => 2020 + i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"
            >
              {t("calendar.nav.today")}
            </Button>
          </div>
        </div>
  );

  const calendarBody =
    enabledDays.length === 0 ? (
      <div
        className={cn(
          "border p-6 text-center text-amber-900 text-sm",
          isAvailabilityMode ? "rounded-xl border-amber-200 bg-amber-50/90" : "rounded-2xl border-amber-200 bg-amber-50",
        )}
      >
        {t("calendar.availability.noEnabledDays")}
      </div>
    ) : visibleTimeSlots.length === 0 ? (
      <div
        className={cn(
          "border p-6 text-center text-amber-900 text-sm",
          isAvailabilityMode ? "rounded-xl border-amber-200 bg-amber-50/90" : "rounded-2xl border-amber-200 bg-amber-50",
        )}
      >
        {t("calendar.availability.noVisibleSlots")}
      </div>
    ) : (
      calendarGrid
    );

  const availabilityPlanningSection =
    mode === "planning" && isAvailabilityMode ? (
      <div className="mb-6 rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">{t("calendar.availability.sectionTitle")}</h2>
        <div className="mt-6 space-y-6">
          {openingHoursEditorRows}
          <div className="border-t border-blue-200/70 pt-6 text-center">
            <h3 className="text-lg font-semibold text-slate-900">{t("calendar.availability.instruction")}</h3>
            <p className="mt-1 text-sm text-slate-600">{t("calendar.availability.saveHint")}</p>
          </div>
          <div>{calendarBody}</div>
        </div>
      </div>
    ) : null;

  const calendarBodyOutsideAvailabilitySection = mode === "planning" && isAvailabilityMode ? null : calendarBody;

  const availabilityBookingConflictPopover =
    availabilityBookingConflict === null ? null : (
      <Popover
        open
        onOpenChange={(open) => {
          if (!open) {
            setAvailabilityBookingConflict(null);
          }
        }}
      >
        <PopoverAnchor asChild>
          <div
            aria-hidden
            className="pointer-events-none fixed z-50 box-border border-0 p-0"
            style={{
              top: availabilityBookingConflict.rect.top,
              left: availabilityBookingConflict.rect.left,
              width: Math.max(availabilityBookingConflict.rect.width, 1),
              height: Math.max(availabilityBookingConflict.rect.height, 1),
            }}
          />
        </PopoverAnchor>
        <PopoverContent
          side="top"
          align="center"
          className="w-[min(22rem,calc(100vw-2rem))] space-y-3 p-4 text-sm"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <p className="font-semibold text-slate-900">{t("calendar.availability.bookingConflictTitle")}</p>
          <p className="text-slate-600">{t("calendar.availability.bookingConflictDescription")}</p>
          <ul className="max-h-60 space-y-2 overflow-y-auto">
            {availabilityBookingConflict.bookings.map((b) => {
              const timeRange = formatBookingAvailabilityTimeRange(b);
              const lineLabel = t("calendar.availability.bookingConflictLine", {
                client: b.client,
                service: b.service,
                timeRange,
              });
              const rowButton = (
                <Button
                  type="button"
                  variant="link"
                  aria-label={t("calendar.availability.bookingConflictOpen")}
                  className="h-auto min-h-0 justify-start whitespace-normal p-0 text-left font-normal text-slate-800 underline-offset-2"
                  onClick={() => {
                    setAvailabilityBookingConflict(null);
                    router.push(`/admin/bookings/${b.id}`);
                  }}
                >
                  {lineLabel}
                </Button>
              );
              return (
                <li key={b.id} className="text-left">
                  {rowButton}
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>
    );

  const deleteBookingConfirmDialog = (
    <AlertDialog
      open={bookingPendingDelete !== null}
      onOpenChange={(open) => {
        if (!open) {
          setBookingPendingDelete(null);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("calendar.deleteBookingDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("calendar.deleteBookingDialog.description", {
              client: bookingPendingDelete?.client ?? "",
              service: bookingPendingDelete?.service ?? "",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={deleteBookingMutation.isPending}>
            {t("calendar.deleteBookingDialog.cancel")}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={deleteBookingMutation.isPending}
            onClick={() => {
              if (bookingPendingDelete) {
                deleteBookingMutation.mutate({ id: bookingPendingDelete.id });
              }
            }}
          >
            {t("calendar.deleteBookingDialog.confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="h-full flex flex-col">
      {availabilityBookingConflictPopover}
      <div className={cn("flex-1 overflow-auto", mode === "planning" && "p-8")}>
        {mode === "planning" ? (
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("calendar.title")}</h1>
              <p className="text-slate-600">{t("calendar.subtitle")}</p>
            </div>
            {availabilityToolbar}
          </div>
        ) : null}

        {weekNavigation}

        {availabilityPlanningSection}
        {calendarBodyOutsideAvailabilitySection}
      </div>

      {mode === "planning" ? (
        <>
          <BookingModal
            isOpen={showBookingModal}
            onClose={() => {
              setPostCreateClientId(null);
              setShowBookingModal(false);
            }}
            slot={selectedSlot ? {
              dayLabel: t(`public.time.days.${selectedSlot.dayKey}.short`),
              date: selectedSlot.dateLabel,
              time: selectedSlot.time,
              dateIso: selectedSlot.dateIso,
            } : null}
            services={modalServices}
            slotBookability={bookingSlotBookability}
            clients={modalClients}
            postCreateClientId={postCreateClientId}
            onPostCreateClientApplied={clearPostCreateClientId}
            onCreateClient={() => {
              resumeBookingAfterClientRef.current = true;
              setShowBookingModal(false);
              setShowNewClientModal(true);
            }}
            onSave={({ serviceId, clientId }) => {
              if (!selectedSlot) {
                return;
              }
              const svc = servicesQuery.data?.find((s) => s.id === serviceId);
              if (!svc) {
                return;
              }
              const startsAt = new Date(`${selectedSlot.dateIso}T${selectedSlot.time}:00`).toISOString();
              createBookingMutation.mutate({
                clientId,
                serviceId,
                startsAt,
                durationMinutes: svc.durationMinutes,
                price: svc.isFree ? 0 : svc.price,
                paidAmount: 0,
                status: svc.requiresValidation ? ("pending" as const) : ("confirmed" as const),
                paymentMethod: "—",
              });
            }}
          />

          <ClientFormModal
            isOpen={showNewClientModal}
            onClose={() => {
              const reopenBooking = resumeBookingAfterClientRef.current;
              resumeBookingAfterClientRef.current = false;
              setShowNewClientModal(false);
              if (reopenBooking) {
                setShowBookingModal(true);
              }
            }}
            onSubmit={handleSaveNewClient}
            isSubmitting={createClientMutation.isPending}
          />

          {deleteBookingConfirmDialog}
        </>
      ) : null}
    </div>
  );
}
