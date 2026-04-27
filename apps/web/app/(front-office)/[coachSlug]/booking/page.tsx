"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Check, ChevronLeft, ChevronRight, Clock, MapPin, Package, Share2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { BackButton } from "../../_components/BackButton";
import { FrontOfficePageLayout } from "../../_components/FrontOfficePageLayout";
import { PublicCoachBanner } from "../../_components/PublicCoachBanner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "#/components/ui/accordion";
import { WeeklyTimeGrid } from "#/components/calendar/WeeklyTimeGrid";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { trpc } from "@web/libs/trpc-client";
import { DEFAULT_CALENDAR_WEEK_HOURS, type WeekHours } from "#/utils/calendar-availability";
import {
  BOOKING_PAGE_GRID_SLOTS,
  buildEnabledDayColumns,
  buildOccupiedSlotKeySet,
  collectDateIsoOccupiedHalfHours,
  computeVisibleTimeSlots,
  getCalendarWeekDates,
  isSlotSelectableForService,
  type BookingPageDayColumn,
} from "#/utils/booking-page-calendar";
import { buildCalendarSlotKey } from "#/utils/calendar-availability";
import { bookingLocalDateKey } from "#/utils/booking-dates";

type SelectedSlot = {
  column: BookingPageDayColumn;
  time: string;
};

function isSameSelectedSlot(s: SelectedSlot, column: BookingPageDayColumn, time: string) {
  return s.column.dateIso === column.dateIso && s.time === time;
}

function slugLooksValid(slug: string) {
  return slug.length >= 2 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug);
}

function toSlotStartDate(column: BookingPageDayColumn, time: string) {
  return new Date(`${column.dateIso}T${time}:00`);
}

function getMonthDates(anchor: Date) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates: Date[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    dates.push(new Date(year, month, day));
  }
  return dates;
}

export default function BookingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams();
  const searchParams = useSearchParams();
  const coachSlug = typeof params["coachSlug"] === "string" ? params["coachSlug"] : "";
  const coachSlugKey = coachSlug.toLowerCase();
  const slugOk = slugLooksValid(coachSlug);
  const servicesHref = `/${coachSlug}/services`;

  const serviceIdParam = searchParams.get("service")?.trim() ?? "";

  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [step, setStep] = useState<"service" | "pick" | "done">("service");
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [mobileHeroImageIndex, setMobileHeroImageIndex] = useState(0);
  const [mobilePickerMonthAnchor, setMobilePickerMonthAnchor] = useState(() => new Date());
  const [mobileMonthSelectOpen, setMobileMonthSelectOpen] = useState(false);
  const [mobileYearSelectOpen, setMobileYearSelectOpen] = useState(false);
  const [mobilePickerOpenDayKey, setMobilePickerOpenDayKey] = useState<string | null>(null);

  const weekDates = useMemo(() => getCalendarWeekDates(weekAnchor), [weekAnchor]);

  const rangeInput = useMemo(() => {
    const weekMonday = weekDates[0]!;
    const weekSunday = weekDates[6]!;
    const wFrom = new Date(weekMonday.getFullYear(), weekMonday.getMonth(), weekMonday.getDate(), 0, 0, 0, 0);
    const wTo = new Date(weekSunday.getFullYear(), weekSunday.getMonth(), weekSunday.getDate(), 23, 59, 59, 999);

    const m = mobilePickerMonthAnchor;
    const mFrom = new Date(m.getFullYear(), m.getMonth(), 1, 0, 0, 0, 0);
    const mTo = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59, 999);

    const from = wFrom.getTime() < mFrom.getTime() ? wFrom : mFrom;
    const to = wTo.getTime() > mTo.getTime() ? wTo : mTo;
    return { rangeFrom: from.toISOString(), rangeTo: to.toISOString() };
  }, [weekDates, mobilePickerMonthAnchor]);

  const storefrontQuery = trpc.publicBooking.getStorefront.useQuery(
    {
      coachSlug: coachSlugKey,
      rangeFrom: rangeInput.rangeFrom,
      rangeTo: rangeInput.rangeTo,
    },
    { enabled: slugOk, retry: false },
  );

  const weekHours = (storefrontQuery.data?.weekHours ?? DEFAULT_CALENDAR_WEEK_HOURS) as WeekHours;
  const closedList = storefrontQuery.data?.closedSlotKeys ?? [];
  const closedSet = useMemo(() => new Set(closedList), [closedList]);
  const services = storefrontQuery.data?.services ?? [];
  const bookingSegments = storefrontQuery.data?.bookingSegments ?? [];
  const coach = storefrontQuery.data?.coach ?? null;
  const minBookingNoticeHours = storefrontQuery.data?.minBookingNoticeHours ?? 0;

  const initialBookingWeekSyncedRef = useRef(false);

  useEffect(() => {
    if (!storefrontQuery.data || initialBookingWeekSyncedRef.current) {
      return;
    }
    const hours = storefrontQuery.data.minBookingNoticeHours ?? 0;
    const thresholdMs = Date.now() + hours * 60 * 60 * 1000;
    const dates = getCalendarWeekDates(weekAnchor);
    const cols = buildEnabledDayColumns(dates, storefrontQuery.data.weekHours as WeekHours);
    if (cols.length === 0) {
      initialBookingWeekSyncedRef.current = true;
      return;
    }
    const hasBookableDay = cols.some((col) => {
      const endOfDay = new Date(col.fullDate);
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay.getTime() >= thresholdMs;
    });
    if (!hasBookableDay) {
      const nextAnchor = new Date(thresholdMs);
      setWeekAnchor(nextAnchor);
      setMobilePickerMonthAnchor(new Date(nextAnchor.getFullYear(), nextAnchor.getMonth(), 1));
      setSelectedSlots([]);
    }
    initialBookingWeekSyncedRef.current = true;
  }, [storefrontQuery.data, weekAnchor]);

  const selectedService = useMemo(() => {
    if (services.length === 0) {
      return null;
    }
    const byParam = serviceIdParam ? services.find((s) => s.id === serviceIdParam) : undefined;
    return byParam ?? services[0] ?? null;
  }, [services, serviceIdParam]);

  useEffect(() => {
    setSelectedSlots([]);
  }, [selectedService?.id]);

  const mobileHeroImageCandidates = useMemo(
    () =>
      [selectedService?.imageUrl ?? null, coach?.imageUrl ?? null].filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      ),
    [selectedService?.imageUrl, coach?.imageUrl],
  );

  useEffect(() => {
    setMobileHeroImageIndex(0);
  }, [selectedService?.id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobileViewport) {
      return;
    }
    const shouldScrollToDrawer =
      step === "service" ||
      step === "pick" ||
      mobileMonthSelectOpen ||
      mobileYearSelectOpen;
    if (!shouldScrollToDrawer) {
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, mobileMonthSelectOpen, mobileYearSelectOpen]);

  const occupiedKeys = useMemo(
    () => buildOccupiedSlotKeySet(weekDates, bookingSegments),
    [weekDates, bookingSegments],
  );

  const enabledColumns = useMemo(() => buildEnabledDayColumns(weekDates, weekHours), [weekDates, weekHours]);

  const visibleSlots = useMemo(
    () =>
      computeVisibleTimeSlots({
        enabledColumns,
        allTimeSlots: BOOKING_PAGE_GRID_SLOTS,
        weekHours,
        closedSlotKeys: closedSet,
        occupiedSlotKeys: occupiedKeys,
      }),
    [enabledColumns, weekHours, closedSet, occupiedKeys],
  );

  const calendarYearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, idx) => y + idx);
  }, []);

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }), [locale]);
  const monthLabelFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { month: "long" }), [locale]);
  const weekRangeLabel = useMemo(() => {
    const from = weekDates[0];
    const to = weekDates[6];
    if (!from || !to) {
      return "";
    }
    const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();
    const fromPart = sameMonth
      ? new Intl.DateTimeFormat(locale, { day: "numeric" }).format(from)
      : new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(from);
    const toPart = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(to);
    return `${fromPart} – ${toPart}`;
  }, [weekDates, locale]);

  const weeklyGridDays = useMemo(() => {
    const today = bookingLocalDateKey(new Date());
    return enabledColumns.map((col) => ({
      key: col.dateIso,
      label: t(`public.time.days.${col.dayKey}.short`),
      subLabel: dateFormatter.format(col.fullDate),
      isToday: col.dateIso === today,
    }));
  }, [enabledColumns, t, dateFormatter]);
  const priceFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }),
    [locale],
  );

  const getDayShortLabel = (dayKey: string) => t(`public.time.days.${dayKey}.short`);
  const getDayDateLabel = (date: Date) => dateFormatter.format(date);

  const requestMutation = trpc.publicBooking.request.useMutation({
    onSuccess: () => {
      setStep("done");
    },
    onError: (err) => {
      if (err.data?.httpStatus === 409) {
        toast.error(t("public.booking.slotTaken"));
      } else if (err.message === "SLOT_TOO_SOON") {
        toast.error(t("public.booking.slotTooSoon"));
      } else {
        toast.error(t("public.booking.error"));
      }
    },
  });

  const isCellBlocked = useCallback(
    (column: BookingPageDayColumn, time: string, occupiedSlotKeys: Set<string>) => {
      if (!selectedService) {
        return true;
      }
      const startsAt = toSlotStartDate(column, time);
      const minStartMs = Date.now() + minBookingNoticeHours * 60 * 60 * 1000;
      if (startsAt.getTime() < minStartMs) {
        return true;
      }
      const key = buildCalendarSlotKey(column.dayKey, time);
      if (occupiedSlotKeys.has(key)) {
        return true;
      }
      const slotBlockedPredicate = (slotTime: string) => {
        const comp = `${column.dateIso}|${slotTime}`;
        for (const s of selectedSlots) {
          const span = collectDateIsoOccupiedHalfHours({
            dateIso: s.column.dateIso,
            startTimeHm: s.time,
            durationMinutes: selectedService.durationMinutes,
          });
          if (!span.has(comp)) {
            continue;
          }
          if (s.column.dateIso === column.dateIso && s.time === time && slotTime === time) {
            continue;
          }
          return true;
        }
        return false;
      };
      if (
        !isSlotSelectableForService({
          column,
          startTime: time,
          serviceDurationMinutes: selectedService.durationMinutes,
          allTimeSlots: BOOKING_PAGE_GRID_SLOTS,
          weekHours,
          closedSlotKeys: closedSet,
          occupiedSlotKeys,
          slotBlockedPredicate,
        })
      ) {
        return true;
      }
      return false;
    },
    [selectedService, minBookingNoticeHours, weekHours, closedSet, selectedSlots],
  );

  const requiredSessionCount = selectedService ? Math.max(1, selectedService.packSize) : 0;
  const allSessionsSelected = Boolean(selectedService && selectedSlots.length === requiredSessionCount);

  const handlePickSlotWithOccupied = (column: BookingPageDayColumn, time: string, occ: Set<string>) => {
    if (!selectedService) {
      return;
    }
    const existingIdx = selectedSlots.findIndex((s) => isSameSelectedSlot(s, column, time));
    if (existingIdx >= 0) {
      setSelectedSlots((prev) => prev.filter((_, i) => i !== existingIdx));
      return;
    }
    if (selectedSlots.length >= requiredSessionCount) {
      return;
    }
    if (isCellBlocked(column, time, occ)) {
      return;
    }
    setSelectedSlots((prev) => [...prev, { column, time }]);
  };

  const handlePickSlot = (column: BookingPageDayColumn, time: string) => {
    handlePickSlotWithOccupied(column, time, occupiedKeys);
  };

  const submitBookingRequest = () => {
    if (!slugOk || !selectedService || !allSessionsSelected) {
      return;
    }
    const sessionsStartsAt = selectedSlots.map((s) =>
      new Date(`${s.column.dateIso}T${s.time}:00`).toISOString(),
    );
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    requestMutation.mutate({
      coachSlug: coachSlugKey,
      serviceId: selectedService.id,
      sessionsStartsAt,
      clientName: "Client public",
      clientEmail: `public-booking-${uniqueSuffix}@bookido.local`,
    });
  };

  const priceLabel =
    selectedService && (selectedService.isFree || selectedService.price <= 0)
      ? t("public.booking.free")
      : selectedService
        ? priceFormatter.format(selectedService.price)
        : "";

  const servicePackSessionsLabel = selectedService
    ? t("public.services.packSessions", { count: selectedService.packSize })
    : "";

  const invalidSlugBlock = (
    <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-950">
      <p className="font-medium">{t("public.booking.invalidSlugTitle")}</p>
    </div>
  );

  const coachNotFoundBlock = (
    <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-950">
      <p className="font-medium">{t("public.booking.coachNotFoundTitle")}</p>
      <p className="mt-2 text-sm text-amber-900/90">{t("public.booking.coachNotFoundHint")}</p>
    </div>
  );

  const loadErrorBlock = (
    <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-900">
      <p>{t("public.services.loadError")}</p>
    </div>
  );

  const loadingBlock = (
    <div className="flex justify-center py-24">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
    </div>
  );

  const applyWeekAnchor = (next: Date) => {
    const mon = getCalendarWeekDates(next)[0]!;
    setWeekAnchor(next);
    setMobilePickerMonthAnchor(new Date(mon.getFullYear(), mon.getMonth(), 1));
  };

  const shiftWeek = (deltaWeeks: number) => {
    const next = new Date(weekAnchor);
    next.setDate(weekAnchor.getDate() + deltaWeeks * 7);
    applyWeekAnchor(next);
  };

  const weekMonday = weekDates[0]!;
  const desktopMonthIndex = weekMonday.getMonth();
  const desktopYear = weekMonday.getFullYear();

  const desktopWeekToolbar = (
    <div className="mb-3 rounded-xl bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:justify-start">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 rounded-lg hover:bg-slate-200"
            onClick={() => shiftWeek(-1)}
            aria-label={t("public.booking.weekPrev")}
          >
            <ChevronLeft className="size-5 text-slate-800" />
          </Button>
          <div className="min-w-0 flex-1 truncate text-center text-sm font-medium text-slate-900 sm:min-w-[180px] sm:flex-none sm:text-left">
            {weekRangeLabel}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 rounded-lg hover:bg-slate-200"
            onClick={() => shiftWeek(1)}
            aria-label={t("public.booking.weekNext")}
          >
            <ChevronRight className="size-5 text-slate-800" />
          </Button>
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:flex-1 sm:justify-end">
          <Select
            value={String(desktopMonthIndex)}
            onValueChange={(value) => applyWeekAnchor(new Date(desktopYear, Number(value), 1))}
          >
            <SelectTrigger className="min-w-0 flex-1 rounded-xl sm:max-w-[160px] sm:flex-none" aria-label={t("public.booking.selectMonth")}>
              <SelectValue placeholder={t("public.booking.selectMonth")} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, idx) => (
                <SelectItem key={idx} value={String(idx)}>
                  {monthLabelFormatter.format(new Date(2000, idx, 1))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(desktopYear)}
            onValueChange={(value) => applyWeekAnchor(new Date(Number(value), desktopMonthIndex, 1))}
          >
            <SelectTrigger className="w-[min(100%,100px)] shrink-0 rounded-xl" aria-label={t("public.booking.selectYear")}>
              <SelectValue placeholder={t("public.booking.selectYear")} />
            </SelectTrigger>
            <SelectContent>
              {calendarYearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const desktopSchedulePanel = (
    <div className="overflow-x-auto rounded-2xl bg-white px-2 py-3 shadow-lg sm:px-3 sm:py-4">
      {desktopWeekToolbar}
      <WeeklyTimeGrid
        compact
        days={weeklyGridDays}
        timeSlots={[...visibleSlots]}
        renderCell={({ day, time }) => {
          const column = enabledColumns.find((c) => c.dateIso === day.key);
          if (!column) {
            return <div className="h-full min-h-8 w-full bg-slate-100" />;
          }
          const blockedRaw = isCellBlocked(column, time, occupiedKeys);
          const selectedHere = selectedSlots.some((s) => isSameSelectedSlot(s, column, time));
          const blocked = blockedRaw && !selectedHere;
          return (
            <button
              type="button"
              disabled={blocked}
              onClick={() => handlePickSlot(column, time)}
              className={`h-full min-h-8 w-full px-0.5 py-0 text-[10px] transition-colors md:text-xs ${
                blocked
                  ? "cursor-not-allowed bg-slate-100 text-slate-400 opacity-60"
                  : selectedHere
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-800 hover:bg-blue-50"
              }`}
            >
              {!blocked && selectedHere ? <Check className="mx-auto size-3.5" /> : null}
            </button>
          );
        }}
      />
    </div>
  );

  const orderedSelectedSlots = useMemo(() => {
    return [...selectedSlots].sort(
      (a, b) =>
        a.column.dateIso.localeCompare(b.column.dateIso) ||
        a.time.localeCompare(b.time),
    );
  }, [selectedSlots]);

  const desktopSlotsSidebar = (
    <div className="rounded-2xl bg-white p-4 shadow-lg sm:p-5">
      <h3 className="mb-2 font-bold text-slate-900">{t("public.payment.slots")}</h3>
      {selectedService ? (
        <p className="mb-3 text-sm text-slate-600">
          {selectedService.name} · {t("public.booking.durationLabel", { minutes: selectedService.durationMinutes })} ·{" "}
          {servicePackSessionsLabel} · {priceLabel}
        </p>
      ) : null}
      <p className="mb-3 text-sm font-medium text-slate-800">
        {t("public.booking.sessionsProgress", { current: selectedSlots.length, total: requiredSessionCount })}
      </p>
      <p className="mb-4 text-sm text-slate-600">{t("public.booking.pickSlotSubtitle")}</p>
      {orderedSelectedSlots.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">{t("public.booking.noSlotsChosenYet")}</p>
      ) : (
        <ul className="mb-4 max-h-48 space-y-2 overflow-y-auto">
          {orderedSelectedSlots.map((slot, idx) => (
            <li
              key={`${slot.column.dateIso}-${slot.time}-${idx}`}
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-800"
            >
              <div className="font-medium">
                {t("public.booking.sessionNumber", { n: idx + 1 })} · {getDayShortLabel(slot.column.dayKey)}
              </div>
              <div className="text-slate-600">
                {getDayDateLabel(slot.column.fullDate)} · {slot.time}
              </div>
            </li>
          ))}
        </ul>
      )}
      {!allSessionsSelected ? (
        <p className="mb-3 text-xs text-amber-800">{t("public.booking.confirmDisabledHint")}</p>
      ) : null}
      <Button
        type="button"
        className="w-full rounded-xl"
        onClick={submitBookingRequest}
        disabled={!allSessionsSelected || requestMutation.isPending}
        pending={requestMutation.isPending}
        pendingChildren={t("public.booking.submitting")}
      >
        {t("public.booking.submit")}
      </Button>
    </div>
  );

  const desktopGrid = (
    <div className="hidden gap-4 lg:grid lg:grid-cols-[1fr_240px] xl:grid-cols-[1fr_260px]">
      {desktopSchedulePanel}
      {desktopSlotsSidebar}
    </div>
  );

  const mobileMonthDates = useMemo(() => getMonthDates(mobilePickerMonthAnchor), [mobilePickerMonthAnchor]);
  const mobileDayColumns = useMemo(
    () => buildEnabledDayColumns(mobileMonthDates, weekHours),
    [mobileMonthDates, weekHours],
  );
  const mobileOccupiedKeys = useMemo(
    () => buildOccupiedSlotKeySet(mobileMonthDates, bookingSegments),
    [mobileMonthDates, bookingSegments],
  );
  const mobileHeroClassName = "relative h-[30vh] min-h-56 overflow-hidden bg-slate-100";
  const mobileDrawerClassName = "fixed inset-x-0 bottom-0 z-40 flex h-[70vh] -translate-y-5 flex-col rounded-t-[28px] bg-white";
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const mobileMonthLabel = monthLabelFormatter.format(mobilePickerMonthAnchor);
  const mobileYearLabel = String(mobilePickerMonthAnchor.getFullYear());
  const selectedMonthIndex = mobilePickerMonthAnchor.getMonth();
  const selectedYearValue = mobilePickerMonthAnchor.getFullYear();
  const mobileYearOptions = useMemo(() => {
    return Array.from({ length: 9 }, (_, idx) => currentYear + idx);
  }, [currentYear]);
  const mobileMonthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, idx) => {
        const monthDate = new Date(selectedYearValue, idx, 1);
        return {
          monthIndex: idx,
          label: monthLabelFormatter.format(monthDate),
        };
      }).filter((monthOption) => {
        if (selectedYearValue > currentYear) {
          return true;
        }
        return monthOption.monthIndex >= currentMonthIndex;
      }),
    [monthLabelFormatter, selectedYearValue, currentYear, currentMonthIndex],
  );
  const fullDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    [locale],
  );
  const pickerAccordionDays = useMemo(
    () =>
      mobileDayColumns.map((column) => ({
        column,
        label: fullDateFormatter.format(column.fullDate),
        slots: BOOKING_PAGE_GRID_SLOTS.filter((time) => {
          if (selectedSlots.some((s) => isSameSelectedSlot(s, column, time))) {
            return true;
          }
          return !isCellBlocked(column, time, mobileOccupiedKeys);
        }),
      }))
      .filter((day) => day.slots.length > 0),
    [mobileDayColumns, fullDateFormatter, mobileOccupiedKeys, isCellBlocked, selectedSlots],
  );

  useEffect(() => {
    const firstDay = pickerAccordionDays[0]?.column;
    setMobilePickerOpenDayKey(firstDay ? firstDay.dateIso : null);
  }, [pickerAccordionDays]);

  const mobileGrid = (
    <div className="mx-auto max-w-3xl lg:hidden">
      <div className={mobileHeroClassName}>
        {mobileHeroImageCandidates[mobileHeroImageIndex] ? (
          <img
            src={mobileHeroImageCandidates[mobileHeroImageIndex]}
            alt={selectedService?.name ?? "service"}
            className="h-full w-full object-cover object-bottom"
            onError={() => {
              setMobileHeroImageIndex((current) => {
                if (current >= mobileHeroImageCandidates.length - 1) {
                  return current;
                }
                return current + 1;
              });
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-200 px-4 text-center text-sm text-slate-600">
            {selectedService?.name ?? ""}
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-5">
          <button
            type="button"
            onClick={() => setStep("service")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm"
            aria-label={t("common.back")}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm"
            aria-label={t("public.booking.share")}
          >
            <Share2 className="size-4.5" />
          </button>
        </div>
      </div>

      <div className={mobileDrawerClassName}>
        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-4 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-2xl font-bold text-slate-900">{selectedService?.name ?? ""}</p>
              <p className="mt-1 text-sm text-slate-500">{selectedService?.address ?? ""}</p>
            </div>
            <p className="shrink-0 text-2xl font-bold text-slate-900">{priceLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 rounded-lg hover:bg-slate-200"
              onClick={() => shiftWeek(-1)}
              aria-label={t("public.booking.weekPrev")}
            >
              <ChevronLeft className="size-5 text-slate-800" />
            </Button>
            <span className="min-w-0 flex-[1_1_140px] truncate text-center text-xs font-medium text-slate-900">
              {weekRangeLabel}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 rounded-lg hover:bg-slate-200"
              onClick={() => shiftWeek(1)}
              aria-label={t("public.booking.weekNext")}
            >
              <ChevronRight className="size-5 text-slate-800" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-w-0 flex-1 justify-center rounded-xl"
              onClick={() => setMobileMonthSelectOpen(true)}
            >
              {mobileMonthLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-w-0 flex-1 justify-center rounded-xl"
              onClick={() => setMobileYearSelectOpen(true)}
            >
              {mobileYearLabel}
            </Button>
          </div>
          <p className="text-sm font-medium text-slate-800">
            {t("public.booking.sessionsProgress", { current: selectedSlots.length, total: requiredSessionCount })}
          </p>
          <div className="space-y-2">
            {pickerAccordionDays.length === 0 ? (
              <p className="text-sm text-slate-500">{t("public.booking.noEnabledDays")}</p>
            ) : (
              <Accordion
                type="single"
                value={mobilePickerOpenDayKey ?? undefined}
                onValueChange={(value) => setMobilePickerOpenDayKey(value)}
                collapsible
                className="rounded-xl border border-slate-200"
              >
                {pickerAccordionDays.map((day) => (
                  <AccordionItem key={day.column.dateIso} value={day.column.dateIso} className="px-3">
                    <AccordionTrigger className="text-base font-semibold capitalize no-underline hover:no-underline">
                      {day.label}
                    </AccordionTrigger>
                    <AccordionContent>
                      {day.slots.length === 0 ? (
                        <p className="text-sm text-slate-500">{t("public.booking.noVisibleSlots")}</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {day.slots.map((time) => (
                            <Button
                              key={`${day.column.dateIso}-${time}`}
                              type="button"
                              variant={
                                selectedSlots.some((s) => isSameSelectedSlot(s, day.column, time))
                                  ? "default"
                                  : "outline"
                              }
                              className="rounded-xl"
                              onClick={() => {
                                handlePickSlotWithOccupied(day.column, time, mobileOccupiedKeys);
                              }}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>
        <div className="border-t border-slate-200 bg-white px-5 py-4">
          <Button
            type="button"
            className="w-full rounded-2xl py-6 text-base font-semibold"
            onClick={submitBookingRequest}
            disabled={!allSessionsSelected || requestMutation.isPending}
            pending={requestMutation.isPending}
            pendingChildren={t("public.booking.submitting")}
          >
            {t("public.booking.submit")}
          </Button>
        </div>
      </div>

      <Dialog open={mobileMonthSelectOpen} onOpenChange={setMobileMonthSelectOpen}>
        <DialogContent className="inset-0 flex h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0">
          <DialogHeader className="border-b border-slate-200 px-4 py-2.5 text-left">
            <DialogTitle>{t("public.mobile.select.month")}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3 pt-3">
            {mobileMonthOptions.map((monthOption) => (
              <Button
                key={monthOption.monthIndex}
                type="button"
                variant={monthOption.monthIndex === selectedMonthIndex ? "default" : "outline"}
                className="h-14 w-full justify-start rounded-xl px-4 text-lg capitalize"
                onClick={() => {
                  const nextDate = new Date(mobilePickerMonthAnchor.getFullYear(), monthOption.monthIndex, 1);
                  setMobilePickerMonthAnchor(nextDate);
                  setWeekAnchor(nextDate);
                  setSelectedSlots([]);
                  setMobileMonthSelectOpen(false);
                }}
              >
                {monthOption.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mobileYearSelectOpen} onOpenChange={setMobileYearSelectOpen}>
        <DialogContent className="inset-0 flex h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0">
          <DialogHeader className="border-b border-slate-200 px-4 py-2.5 text-left">
            <DialogTitle>{t("public.mobile.select.year")}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3 pt-3">
            {mobileYearOptions.map((yearOption) => (
              <Button
                key={yearOption}
                type="button"
                variant={yearOption === selectedYearValue ? "default" : "outline"}
                className="h-14 w-full justify-start rounded-xl px-4 text-lg"
                onClick={() => {
                  const nextDate = new Date(yearOption, mobilePickerMonthAnchor.getMonth(), 1);
                  setMobilePickerMonthAnchor(nextDate);
                  setWeekAnchor(nextDate);
                  setSelectedSlots([]);
                  setMobileYearSelectOpen(false);
                }}
              >
                {yearOption}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const coachBannerPick = coach ? <PublicCoachBanner name={coach.name} bio={coach.bio} imageUrl={coach.imageUrl} /> : null;

  const doneBlock = (
    <div className="mx-auto max-w-2xl pt-12 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
      >
        <Check className="h-10 w-10 text-green-600" />
      </motion.div>
      <h2 className="mb-4 text-3xl font-bold text-slate-900">{t("public.confirmation.title")}</h2>
      <p className="mb-8 text-lg text-slate-600">{t("public.confirmation.successMessage", { service: selectedService?.name ?? "" })}</p>
      <p className="text-md mb-8 text-slate-600">{t("public.confirmation.successDetails")}</p>
      <Link
        href={`/${coachSlug}/services`}
        className="inline-flex rounded-xl bg-blue-600 px-8 py-4 font-medium text-white transition-colors hover:bg-blue-700"
      >
        {t("public.confirmation.new")}
      </Link>
    </div>
  );

  const pickStepContent = (
    <>
      {storefrontQuery.isLoading ? (
        loadingBlock
      ) : enabledColumns.length === 0 ? (
        <p className="py-12 text-center text-slate-600">{t("public.booking.noEnabledDays")}</p>
      ) : visibleSlots.length === 0 ? (
        <p className="py-12 text-center text-slate-600">{t("public.booking.noVisibleSlots")}</p>
      ) : (
        <>
          <div className="hidden lg:block">
            {coachBannerPick}
            <h2 className="mb-2 text-center text-3xl font-bold text-slate-900">{t("public.booking.calendarTitle")}</h2>
            <p className="mb-2 text-center text-slate-600">{selectedService?.name ?? ""}</p>
          </div>
          {desktopGrid}
          {mobileGrid}
        </>
      )}
    </>
  );

  const serviceDetailsStep = selectedService ? (
    <div className="mx-auto max-w-3xl">
      <div className={`${mobileHeroClassName} md:hidden`}>
        {mobileHeroImageCandidates[mobileHeroImageIndex] ? (
          <img
            src={mobileHeroImageCandidates[mobileHeroImageIndex]}
            alt={selectedService.name}
            className="h-full w-full object-cover object-bottom"
            onError={() => {
              setMobileHeroImageIndex((current) => {
                if (current >= mobileHeroImageCandidates.length - 1) {
                  return current;
                }
                return current + 1;
              });
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-200 px-4 text-center text-sm text-slate-600">
            {selectedService.name}
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-5">
          <Link
            href={servicesHref}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm"
            aria-label={t("common.back")}
          >
            <ChevronLeft className="size-5" />
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm"
            aria-label={t("public.booking.share")}
          >
            <Share2 className="size-4.5" />
          </button>
        </div>
      </div>

      <div className={`${mobileDrawerClassName} md:hidden`}>
        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-4 pt-4">
          {coach ? <PublicCoachBanner name={coach.name} bio={coach.bio} imageUrl={coach.imageUrl} /> : null}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-2xl font-bold text-slate-900">{selectedService.name}</p>
              <p className="mt-1 text-sm text-slate-500">{selectedService.address}</p>
            </div>
            <p className="shrink-0 text-2xl font-bold text-slate-900">{priceLabel}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
              {t("public.booking.durationLabel", { minutes: selectedService.durationMinutes })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
              <Package className="size-3.5 shrink-0 text-slate-500" />
              {servicePackSessionsLabel}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-slate-700">{selectedService.description}</p>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <iframe
              title={t("public.booking.mapTitle")}
              src={`https://www.google.com/maps?q=${encodeURIComponent(selectedService.address)}&output=embed`}
              className="h-44 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

        </div>

        <div className="border-t border-slate-200 bg-white px-5 py-4">
          <Button type="button" className="w-full rounded-2xl py-6 text-base font-semibold" onClick={() => setStep("pick")}>
            {t("public.booking.pickSlotCta")}
          </Button>
        </div>
      </div>

      <div className="hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:block md:p-8">
        {coach ? <PublicCoachBanner name={coach.name} bio={coach.bio} imageUrl={coach.imageUrl} /> : null}
        <h2 className="mb-6 text-3xl font-bold text-slate-900">{t("public.booking.serviceDetailsTitle")}</h2>
        <div className="space-y-5">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {selectedService.imageUrl ? (
              <img src={selectedService.imageUrl} alt={selectedService.name} className="h-52 w-full object-cover sm:h-64" />
            ) : (
              <div className="flex h-52 items-center justify-center px-4 text-center text-sm text-slate-500 sm:h-64">
                {selectedService.name}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-slate-900">{selectedService.name}</h3>
            <p className="text-slate-600">{selectedService.description}</p>

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
              <p className="inline-flex items-center gap-2">
                <Clock className="size-4 text-slate-500" />
                {t("public.booking.durationLabel", { minutes: selectedService.durationMinutes })}
              </p>
              <p className="inline-flex items-center gap-2">
                <Package className="size-4 text-slate-500" />
                {servicePackSessionsLabel}
              </p>
              <p className="inline-flex items-start gap-2 sm:col-span-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-slate-500" />
                {selectedService.address}
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <iframe
                title={t("public.booking.mapTitle")}
                src={`https://www.google.com/maps?q=${encodeURIComponent(selectedService.address)}&output=embed`}
                className="h-56 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <p className="text-3xl font-bold text-blue-700">{priceLabel}</p>
            <div className="flex gap-3 pt-2">
              <Button type="button" className="flex-1" onClick={() => setStep("pick")}>
                {t("public.booking.pickSlotCta")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const mainInner = !slugOk ? (
    invalidSlugBlock
  ) : storefrontQuery.isLoading ? (
    loadingBlock
  ) : storefrontQuery.isError && storefrontQuery.error?.data?.httpStatus === 404 ? (
    coachNotFoundBlock
  ) : storefrontQuery.isError ? (
    loadErrorBlock
  ) : services.length === 0 ? (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-700">
      <p>{t("public.services.empty")}</p>
      <Link href={servicesHref} className="mt-4 inline-block font-medium text-blue-600 hover:text-blue-700">
        {t("common.back")}
      </Link>
    </div>
  ) : step === "done" ? (
    doneBlock
  ) : step === "service" ? (
    serviceDetailsStep
  ) : (
    pickStepContent
  );

  return (
    <FrontOfficePageLayout
      rootClassName={
        step === "service" || step === "pick"
          ? "min-h-screen bg-black px-0 py-0 md:bg-slate-50 md:px-2 md:py-8 lg:px-3"
          : "min-h-screen bg-slate-50 px-6 py-12"
      }
      hideBrandOnMobile={step === "service" || step === "pick"}
      topAction={
        step === "done" || step === "service" || step === "pick" ? null : <BackButton label={t("common.back")} fallbackHref={servicesHref} />
      }
    >
      <div
        className={
          step === "service" || step === "pick"
            ? "mx-auto w-full max-w-[1600px] pt-0 md:pt-6"
            : "mx-auto max-w-5xl pt-8"
        }
      >
        {mainInner}
      </div>
    </FrontOfficePageLayout>
  );
}
