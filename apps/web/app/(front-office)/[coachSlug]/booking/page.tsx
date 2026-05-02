"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Check, ChevronLeft, ChevronRight, Clock, MapPin, Package, Share2, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { CalendarSlotHoverHint, WeeklyTimeGrid } from "#/components/calendar/WeeklyTimeGrid";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { trpc } from "@web/libs/trpc-client";
import { isPublicCoachStorefrontNotFoundError } from "#/utils/trpc-public-coach-not-found";
import { DEFAULT_CALENDAR_WEEK_HOURS, type WeekHours } from "#/utils/calendar-availability";
import {
  buildEnabledDayColumns,
  buildOccupiedSlotKeySet,
  buildPublicBookingGridSlotStarts,
  buildWeekGridColumns,
  collectDateIsoOccupiedHalfHours,
  computeVisibleTimeSlots,
  findFirstWeekAnchorWithSelectableSlot,
  getCalendarWeekDates,
  isSlotSelectableForService,
  type BookingPageDayColumn,
} from "#/utils/booking-page-calendar";
import { buildCalendarSlotKey, timeToMinutes } from "#/utils/calendar-availability";
import { bookingLocalDateKey, totalMinutesToTimeHm } from "#/utils/booking-dates";

type SelectedSlot = {
  column: BookingPageDayColumn;
  time: string;
};

const BOOKING_CLIENT_CACHE_KEY = "bookido.publicBooking.client";

function isSameSelectedSlot(s: SelectedSlot, column: BookingPageDayColumn, time: string) {
  return s.column.dateIso === column.dateIso && s.time === time;
}

function findSelectedSlotIndexCoveringHalfHour(
  slots: readonly SelectedSlot[],
  column: BookingPageDayColumn,
  time: string,
  durationMinutes: number,
) {
  const comp = `${column.dateIso}|${time}`;
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i]!;
    const span = collectDateIsoOccupiedHalfHours({
      dateIso: s.column.dateIso,
      startTimeHm: s.time,
      durationMinutes,
      slotMinutes: durationMinutes,
    });
    if (span.has(comp)) {
      return i;
    }
  }
  return -1;
}

function isHalfHourInSelectedSlotSpan(
  slots: readonly SelectedSlot[],
  column: BookingPageDayColumn,
  time: string,
  durationMinutes: number,
) {
  return findSelectedSlotIndexCoveringHalfHour(slots, column, time, durationMinutes) >= 0;
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
  const checkoutStatusParam = searchParams.get("checkout")?.trim() ?? "";
  const checkoutSessionIdParam = searchParams.get("session_id")?.trim() ?? "";

  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [step, setStep] = useState<"service" | "pick" | "details" | "done">(() =>
    checkoutStatusParam === "success" ? "done" : "service",
  );
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [mobileHeroImageIndex, setMobileHeroImageIndex] = useState(0);
  const [mobilePickerMonthAnchor, setMobilePickerMonthAnchor] = useState(() => new Date());
  const [mobileMonthSelectOpen, setMobileMonthSelectOpen] = useState(false);
  const [mobileYearSelectOpen, setMobileYearSelectOpen] = useState(false);
  const [mobilePickerOpenDayKey, setMobilePickerOpenDayKey] = useState<string | null>(null);
  const [landingRangeStartMonday, setLandingRangeStartMonday] = useState<Date | null>(null);
  const bookingClientSchema = useMemo(
    () =>
      z.object({
        firstName: z.string().trim().min(1, t("public.booking.validation.firstName")),
        lastName: z.string().trim().min(1, t("public.booking.validation.lastName")),
        email: z.string().trim().email(t("public.booking.validation.email")),
        rememberMe: z.boolean(),
      }),
    [t],
  );
  type BookingClientFormValues = z.infer<typeof bookingClientSchema>;
  const bookingClientForm = useForm<BookingClientFormValues>({
    resolver: zodResolver(bookingClientSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      rememberMe: true,
    },
  });

  const weekDates = useMemo(() => getCalendarWeekDates(weekAnchor), [weekAnchor]);

  const storefrontQueryRange = useMemo(() => {
    const baseMonday = landingRangeStartMonday ?? getCalendarWeekDates(weekAnchor)[0]!;
    const fromDate = new Date(baseMonday.getFullYear(), baseMonday.getMonth(), baseMonday.getDate(), 0, 0, 0, 0);
    const horizon = new Date(fromDate);
    horizon.setDate(horizon.getDate() + 7 * 52);

    const m = mobilePickerMonthAnchor;
    const mFrom = new Date(m.getFullYear(), m.getMonth(), 1, 0, 0, 0, 0);
    const mTo = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59, 999);

    const rangeFrom = new Date(Math.min(fromDate.getTime(), mFrom.getTime()));
    const rangeTo = new Date(Math.max(horizon.getTime(), mTo.getTime()));
    return { rangeFrom: rangeFrom.toISOString(), rangeTo: rangeTo.toISOString() };
  }, [landingRangeStartMonday, weekAnchor, mobilePickerMonthAnchor]);

  const storefrontQuery = trpc.publicBooking.getStorefront.useQuery(
    {
      coachSlug: coachSlugKey,
      rangeFrom: storefrontQueryRange.rangeFrom,
      rangeTo: storefrontQueryRange.rangeTo,
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

  const bookingCalendarClientClockSyncedRef = useRef(false);
  useLayoutEffect(() => {
    if (bookingCalendarClientClockSyncedRef.current) {
      return;
    }
    bookingCalendarClientClockSyncedRef.current = true;
    const now = new Date();
    setWeekAnchor(now);
    setMobilePickerMonthAnchor(new Date(now.getFullYear(), now.getMonth(), 1));
    const monday = getCalendarWeekDates(now)[0]!;
    setLandingRangeStartMonday(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0, 0));
  }, []);

  const selectedService = useMemo(() => {
    if (services.length === 0) {
      return null;
    }
    const byParam = serviceIdParam ? services.find((s) => s.id === serviceIdParam) : undefined;
    return byParam ?? services[0] ?? null;
  }, [services, serviceIdParam]);

  const publicBookingSlotStarts = useMemo(
    () => buildPublicBookingGridSlotStarts(selectedService?.durationMinutes ?? 30),
    [selectedService?.durationMinutes],
  );

  const bookingFirstSelectableWeekSyncKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!landingRangeStartMonday || !storefrontQuery.data || storefrontQuery.isFetching || !selectedService) {
      return;
    }
    const syncKey = `${coachSlugKey}:${selectedService.id}:${landingRangeStartMonday.getTime()}`;
    if (bookingFirstSelectableWeekSyncKeyRef.current === syncKey) {
      return;
    }
    bookingFirstSelectableWeekSyncKeyRef.current = syncKey;
    const scanStart = new Date(
      landingRangeStartMonday.getFullYear(),
      landingRangeStartMonday.getMonth(),
      landingRangeStartMonday.getDate(),
      12,
      0,
      0,
      0,
    );
    const minStartMs = Date.now() + minBookingNoticeHours * 60 * 60 * 1000;
    const firstAnchor = findFirstWeekAnchorWithSelectableSlot({
      startWeekAnchor: scanStart,
      weekHours: storefrontQuery.data.weekHours as WeekHours,
      closedSlotKeys: new Set(storefrontQuery.data.closedSlotKeys ?? []),
      bookingSegments: storefrontQuery.data.bookingSegments ?? [],
      allTimeSlots: buildPublicBookingGridSlotStarts(selectedService.durationMinutes),
      serviceDurationMinutes: selectedService.durationMinutes,
      minStartMs,
    });
    if (firstAnchor) {
      setWeekAnchor(firstAnchor);
      setMobilePickerMonthAnchor(new Date(firstAnchor.getFullYear(), firstAnchor.getMonth(), 1));
    }
  }, [
    coachSlugKey,
    landingRangeStartMonday,
    storefrontQuery.data,
    storefrontQuery.isFetching,
    selectedService,
    minBookingNoticeHours,
  ]);

  useEffect(() => {
    setSelectedSlots([]);
  }, [selectedService?.id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem(BOOKING_CLIENT_CACHE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        firstName?: string;
        lastName?: string;
        email?: string;
      };
      bookingClientForm.reset({
        firstName: parsed.firstName?.trim() ?? "",
        lastName: parsed.lastName?.trim() ?? "",
        email: parsed.email?.trim() ?? "",
        rememberMe: true,
      });
    } catch {
      // ignore malformed cached value
    }
  }, [bookingClientForm]);

  const mobileHeroImageCandidates = useMemo(
    () =>
      [selectedService?.imageUrl ?? null, coach?.imageUrl ?? null].filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      ),
    [selectedService?.imageUrl, coach?.imageUrl],
  );

  const selectedServiceGoogleMapsHref = selectedService?.address?.trim().length
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedService.address.trim())}`
    : "";

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
  const weekGridColumns = useMemo(() => buildWeekGridColumns(weekDates, weekHours), [weekDates, weekHours]);

  const visibleSlots = useMemo(
    () =>
      computeVisibleTimeSlots({
        enabledColumns,
        allTimeSlots: publicBookingSlotStarts,
        weekHours,
        closedSlotKeys: closedSet,
        occupiedSlotKeys: occupiedKeys,
        serviceDurationMinutes: selectedService?.durationMinutes,
      }),
    [enabledColumns, weekHours, closedSet, occupiedKeys, publicBookingSlotStarts, selectedService?.durationMinutes],
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
    const todayIso = bookingLocalDateKey(new Date());
    return weekGridColumns.map((col) => ({
      key: col.dateIso,
      label: t(`public.time.days.${col.dayKey}.short`),
      subLabel: dateFormatter.format(col.fullDate),
      isToday: col.dateIso === todayIso,
      mutedLabel: !col.dayEnabled,
      isCompact: !col.dayEnabled,
    }));
  }, [weekGridColumns, t, dateFormatter]);
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
  const createCheckoutSessionMutation = trpc.publicBooking.createCheckoutSession.useMutation({
    onSuccess: (payload) => {
      window.location.href = payload.url;
    },
    onError: () => {
      toast.error(t("public.booking.paymentStartError"));
    },
  });
  const confirmCheckoutMutation = trpc.publicBooking.confirmCheckout.useMutation({
    onSuccess: () => {
      setStep("done");
      if (typeof window !== "undefined") {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete("checkout");
        currentUrl.searchParams.delete("session_id");
        window.history.replaceState({}, "", currentUrl.toString());
      }
    },
    onError: () => {
      toast.error(t("public.booking.paymentConfirmError"));
    },
  });

  useEffect(() => {
    const awaitingStripeConfirm =
      checkoutStatusParam === "success" && checkoutSessionIdParam.length > 0;
    if (!awaitingStripeConfirm) {
      confirmCheckoutMutation.reset();
    }
  }, [checkoutStatusParam, checkoutSessionIdParam, confirmCheckoutMutation.reset]);

  const requiredSessionCount = selectedService ? Math.max(1, selectedService.packSize) : 0;

  const isCellBlockedByBaseRules = useCallback(
    (column: BookingPageDayColumn, time: string, occupiedSlotKeys: Set<string>) => {
      if (!selectedService) {
        return true;
      }
      const startsAt = toSlotStartDate(column, time);
      const minStartMs = Date.now() + minBookingNoticeHours * 60 * 60 * 1000;
      if (startsAt.getTime() < minStartMs) {
        return true;
      }
      const tStart = timeToMinutes(time);
      const occEnd = tStart + selectedService.durationMinutes;
      for (let u = Math.floor(tStart / 30) * 30; u < occEnd; u += 30) {
        const hm = totalMinutesToTimeHm(u);
        if (occupiedSlotKeys.has(buildCalendarSlotKey(column.dayKey, hm))) {
          return true;
        }
      }
      const packSize = Math.max(1, selectedService.packSize);
      const packOverlapSlots: SelectedSlot[] =
        packSize <= 1
          ? []
          : selectedSlots.length >= packSize
            ? selectedSlots.slice(0, -1)
            : selectedSlots;
      const slotBlockedPredicate = (slotTime: string) => {
        const comp = `${column.dateIso}|${slotTime}`;
        for (const s of packOverlapSlots) {
          const span = collectDateIsoOccupiedHalfHours({
            dateIso: s.column.dateIso,
            startTimeHm: s.time,
            durationMinutes: selectedService.durationMinutes,
          });
          if (span.has(comp)) {
            return true;
          }
        }
        return false;
      };
      if (
        !isSlotSelectableForService({
          column,
          startTime: time,
          serviceDurationMinutes: selectedService.durationMinutes,
          allTimeSlots: publicBookingSlotStarts,
          weekHours,
          closedSlotKeys: closedSet,
          occupiedSlotKeys,
          gridSlotMinutes: selectedService.durationMinutes,
          slotBlockedPredicate,
        })
      ) {
        return true;
      }
      return false;
    },
    [selectedService, minBookingNoticeHours, weekHours, closedSet, selectedSlots, publicBookingSlotStarts],
  );
  const allSessionsSelected = Boolean(selectedService && selectedSlots.length === requiredSessionCount);

  const isCellBlocked = useCallback(
    (column: BookingPageDayColumn, time: string, occupiedSlotKeys: Set<string>) => {
      return isCellBlockedByBaseRules(column, time, occupiedSlotKeys);
    },
    [isCellBlockedByBaseRules],
  );

  const isSlotBlockedByMinNotice = useCallback(
    (column: BookingPageDayColumn, time: string) => {
      const startsAt = toSlotStartDate(column, time);
      const minStartMs = Date.now() + minBookingNoticeHours * 60 * 60 * 1000;
      return startsAt.getTime() < minStartMs;
    },
    [minBookingNoticeHours],
  );

  const handlePickSlotWithOccupied = (column: BookingPageDayColumn, time: string, occ: Set<string>) => {
    if (!selectedService) {
      return;
    }
    const coveringIdx = findSelectedSlotIndexCoveringHalfHour(
      selectedSlots,
      column,
      time,
      selectedService.durationMinutes,
    );
    if (coveringIdx >= 0) {
      setSelectedSlots((prev) => prev.filter((_, i) => i !== coveringIdx));
      return;
    }
    if (isCellBlockedByBaseRules(column, time, occ)) {
      return;
    }
    if (selectedSlots.length >= requiredSessionCount) {
      setSelectedSlots((prev) => {
        if (prev.length === 0) {
          return [{ column, time }];
        }
        const next = [...prev];
        next[next.length - 1] = { column, time };
        return next;
      });
      return;
    }
    setSelectedSlots((prev) => [...prev, { column, time }]);
  };

  const handlePickSlot = (column: BookingPageDayColumn, time: string) => {
    handlePickSlotWithOccupied(column, time, occupiedKeys);
  };
  const handleRemoveSelectedSlot = (slotToRemove: SelectedSlot) => {
    setSelectedSlots((prev) =>
      prev.filter((slot) => !(slot.column.dateIso === slotToRemove.column.dateIso && slot.time === slotToRemove.time)),
    );
  };

  useEffect(() => {
    if (checkoutStatusParam !== "cancel") {
      return;
    }
    toast.error(t("public.booking.paymentCancelled"));
  }, [checkoutStatusParam, t]);

  useEffect(() => {
    if (checkoutStatusParam !== "success") {
      return;
    }
    setStep("done");
    if (!checkoutSessionIdParam || checkoutSessionIdParam.length === 0) {
      return;
    }
    if (confirmCheckoutMutation.isPending || confirmCheckoutMutation.isSuccess) {
      return;
    }
    confirmCheckoutMutation.mutate({
      coachSlug: coachSlugKey,
      sessionId: checkoutSessionIdParam,
    });
  }, [checkoutSessionIdParam, checkoutStatusParam, coachSlugKey, confirmCheckoutMutation]);

  const submitBookingRequest = bookingClientForm.handleSubmit((values) => {
    if (!slugOk || !selectedService || !allSessionsSelected) {
      return;
    }
    const sessionsStartsAt = selectedSlots.map((s) =>
      new Date(`${s.column.dateIso}T${s.time}:00`).toISOString(),
    );
    const payloadLocale: "fr" | "en" = locale === "fr" ? "fr" : "en";
    const normalizedFirstName = values.firstName.trim();
    const normalizedLastName = values.lastName.trim();
    const normalizedEmail = values.email.trim().toLowerCase();
    const payload = {
      coachSlug: coachSlugKey,
      serviceId: selectedService.id,
      sessionsStartsAt,
      clientName: `${normalizedFirstName} ${normalizedLastName}`.trim(),
      clientEmail: normalizedEmail,
      locale: payloadLocale,
    };

    if (typeof window !== "undefined") {
      if (values.rememberMe) {
        window.localStorage.setItem(
          BOOKING_CLIENT_CACHE_KEY,
          JSON.stringify({
            firstName: normalizedFirstName,
            lastName: normalizedLastName,
            email: normalizedEmail,
          }),
        );
      } else {
        window.localStorage.removeItem(BOOKING_CLIENT_CACHE_KEY);
      }
    }

    if (selectedService.isFree || selectedService.price <= 0) {
      requestMutation.mutate(payload);
      return;
    }

    createCheckoutSessionMutation.mutate(payload);
  });

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
      <Link
        href="/"
        className="mt-3 inline-block text-sm font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800"
      >
        {t("public.booking.coachNotFoundHome")}
      </Link>
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
        <div className="flex min-w-0 flex-1 items-center justify-center gap-3 sm:gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 touch-manipulation rounded-lg hover:bg-slate-200/90 active:bg-slate-300/70"
            onClick={() => shiftWeek(-1)}
            aria-label={t("public.booking.weekPrev")}
          >
            <ChevronLeft className="size-5 text-slate-800" />
          </Button>
          <div className="min-w-0 max-w-[min(100%,280px)] shrink truncate text-center text-sm font-medium tabular-nums text-slate-900 sm:max-w-[min(100%,320px)]">
            {weekRangeLabel}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 touch-manipulation rounded-lg hover:bg-slate-200/90 active:bg-slate-300/70"
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
          const column = weekGridColumns.find((c) => c.dateIso === day.key);
          if (!column) {
            return <div className="h-full min-h-8 w-full bg-slate-100" />;
          }
          if (!column.dayEnabled) {
            return <div className="h-full min-h-8 w-full bg-slate-100" aria-hidden />;
          }
          const blockedRaw = isCellBlocked(column, time, occupiedKeys);
          const selectedStartHere = selectedSlots.some((s) => isSameSelectedSlot(s, column, time));
          const inSelectedSpan = isHalfHourInSelectedSlotSpan(
            selectedSlots,
            column,
            time,
            selectedService?.durationMinutes ?? 0,
          );
          const blocked = blockedRaw && !inSelectedSpan;
          return (
            (() => {
              const slotButton = (
                <button
                  type="button"
                  disabled={blocked}
                  onClick={() => handlePickSlot(column, time)}
                  className={`h-full min-h-8 w-full px-0.5 py-0 text-[10px] transition-colors md:text-xs ${
                    blocked
                      ? "cursor-not-allowed bg-slate-100 text-slate-400 opacity-60"
                      : inSelectedSpan
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-800 hover:bg-blue-50"
                  }`}
                >
                  {!blocked && selectedStartHere ? <Check className="mx-auto size-3.5" /> : null}
                </button>
              );

              if (blocked && !inSelectedSpan && isSlotBlockedByMinNotice(column, time)) {
                return (
                  <CalendarSlotHoverHint label={t("public.booking.minNoticeHoverHint", { hours: minBookingNoticeHours })}>
                    {slotButton}
                  </CalendarSlotHoverHint>
                );
              }

              return slotButton;
            })()
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
  const firstNamePreview = bookingClientForm.watch("firstName").trim();
  const lastNamePreview = bookingClientForm.watch("lastName").trim();
  const emailPreview = bookingClientForm.watch("email").trim();
  const fullNamePreview = `${firstNamePreview} ${lastNamePreview}`.trim();
  const hasEmailError = Boolean(bookingClientForm.formState.errors.email);
  const canSubmitBooking = firstNamePreview.length > 0 && lastNamePreview.length > 0 && emailPreview.length > 0 && !hasEmailError;
  const bookingStepperSteps = [
    { key: "service", label: t("public.booking.stepper.service") },
    { key: "pick", label: t("public.booking.stepper.date") },
    { key: "details", label: t("public.booking.stepper.recap") },
  ] as const;
  const bookingStepperCurrentIndex = step === "service" ? 0 : step === "pick" ? 1 : 2;

  const stepperIndexReachable = (idx: number) =>
    idx === 0 || (idx === 1 && Boolean(selectedService)) || (idx === 2 && Boolean(selectedService) && allSessionsSelected);

  const goToStepperIndex = (idx: number) => {
    if (idx === bookingStepperCurrentIndex) {
      return;
    }
    if (!stepperIndexReachable(idx)) {
      return;
    }
    if (idx === 0) {
      setStep("service");
      return;
    }
    if (idx === 1) {
      setStep("pick");
      return;
    }
    setStep("details");
  };

  const bookingStepper = (
    <div className="mx-auto w-full max-w-md">
      <div className="flex justify-center rounded-full border border-slate-200/90 bg-white/95 px-3 py-2.5 shadow-md shadow-slate-900/[0.04] backdrop-blur-md sm:px-6">
        <div className="flex items-center">
          {bookingStepperSteps.map((stepItem, idx) => {
            const done = idx < bookingStepperCurrentIndex;
            const current = idx === bookingStepperCurrentIndex;
            const reachable = stepperIndexReachable(idx);
            const isSame = idx === bookingStepperCurrentIndex;
            const canClick = reachable && !isSame;
            const circleClass = current
              ? "border-0 bg-blue-600 shadow-sm shadow-blue-600/25 ring-2 ring-blue-100"
              : done
                ? "border-0 bg-blue-500"
                : "border border-slate-200 bg-white";
            const lineClass = done ? "bg-blue-400/80" : "bg-slate-200";
            const labelClass = current ? "font-semibold text-slate-900" : done ? "font-medium text-slate-600" : "font-medium text-slate-400";
            return (
              <div key={stepItem.key} className="flex items-center">
                <button
                  type="button"
                  onClick={() => goToStepperIndex(idx)}
                  disabled={!canClick}
                  className={`flex w-[76px] flex-col items-center rounded-lg pb-0.5 pt-0.5 outline-none transition-opacity sm:w-[88px] ${
                    canClick ? "cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-500/40" : "cursor-default"
                  }`}
                  aria-current={current ? "step" : undefined}
                >
                  <span className={`block h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5 ${circleClass}`} />
                  <span className={`mt-1.5 text-center text-[10px] tracking-tight sm:text-xs ${labelClass}`}>{stepItem.label}</span>
                </button>
                {idx < bookingStepperSteps.length - 1 ? (
                  <span className={`mx-1 h-px w-9 shrink-0 sm:mx-1.5 sm:w-11 ${lineClass}`} aria-hidden />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );


  const desktopSlotsSidebar = (
    <div className="rounded-2xl bg-white p-4 shadow-lg sm:p-5">
      <h3 className="mb-3 font-bold text-slate-900">{t("public.booking.sidebarSelectionsTitle")}</h3>
      {selectedService ? (
        <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {selectedService.imageUrl ? (
            <img src={selectedService.imageUrl} alt={selectedService.name} className="h-28 w-full object-cover" />
          ) : (
            <div className="flex h-28 items-center justify-center px-3 text-center text-sm text-slate-500">
              {selectedService.name}
            </div>
          )}
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-slate-900">{selectedService.name}</p>
          </div>
        </div>
      ) : null}
      <p className="mb-3 text-sm font-medium text-slate-800">
        {t("public.booking.sessionsProgress", { current: selectedSlots.length, total: requiredSessionCount })}
      </p>
      {orderedSelectedSlots.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">{t("public.booking.noSelectionYet")}</p>
      ) : (
        <ul className="mb-4 max-h-48 space-y-2 overflow-y-auto">
          {orderedSelectedSlots.map((slot, idx) => (
            <li
              key={`${slot.column.dateIso}-${slot.time}-${idx}`}
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium">
                    {t("public.booking.sessionNumber", { n: idx + 1 })} · {getDayShortLabel(slot.column.dayKey)}
                  </div>
                  <div className="text-slate-600">
                    {getDayDateLabel(slot.column.fullDate)} · {slot.time}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSelectedSlot(slot)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-blue-100 hover:text-slate-800"
                  aria-label={t("public.booking.removeSelectionAria", { session: idx + 1 })}
                >
                  <X className="size-3.5" />
                </button>
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
        onClick={() => setStep("details")}
        disabled={!allSessionsSelected}
      >
        {t("public.booking.continueToDetails")}
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
  const mobileDrawerClassName =
    "fixed inset-x-0 bottom-0 z-40 flex h-[70vh] -translate-y-[10vh] flex-col rounded-t-[28px] border-t border-slate-200/80 bg-white shadow-[0_-12px_48px_-12px_rgba(15,23,42,0.12)]";
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
        selectedTimes: selectedSlots
          .filter((slot) => slot.column.dateIso === column.dateIso)
          .map((slot) => slot.time)
          .sort((a, b) => a.localeCompare(b)),
        slots: publicBookingSlotStarts.filter((time) => {
          if (
            selectedService &&
            isHalfHourInSelectedSlotSpan(selectedSlots, column, time, selectedService.durationMinutes)
          ) {
            return true;
          }
          return !isCellBlockedByBaseRules(column, time, mobileOccupiedKeys);
        }),
      }))
      .filter((day) => day.slots.length > 0),
    [
      mobileDayColumns,
      fullDateFormatter,
      mobileOccupiedKeys,
      isCellBlockedByBaseRules,
      selectedSlots,
      selectedService,
      publicBookingSlotStarts,
    ],
  );

  useEffect(() => {
    setMobilePickerOpenDayKey((currentOpenDayKey) => {
      if (!pickerAccordionDays.length) {
        return null;
      }
      if (currentOpenDayKey && pickerAccordionDays.some((day) => day.column.dateIso === currentOpenDayKey)) {
        return currentOpenDayKey;
      }
      return pickerAccordionDays[0]?.column.dateIso ?? null;
    });
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
        <div className="mx-auto mt-3 h-1.5 w-14 shrink-0 rounded-full bg-slate-200" />
        <div className="shrink-0 border-b border-slate-100 bg-white px-3 pb-2 pt-1">
          {bookingStepper}
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-2 pt-4">
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
              variant="outline"
              className="min-w-0 flex-[2] justify-center rounded-xl capitalize"
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
                      <div className="min-w-0">
                        <p className="truncate">{day.label}</p>
                        {day.selectedTimes.length > 0 ? (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {day.selectedTimes.map((time) => (
                              <span
                                key={`${day.column.dateIso}-${time}`}
                                className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                              >
                                {time}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
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
                                selectedService &&
                                isHalfHourInSelectedSlotSpan(
                                  selectedSlots,
                                  day.column,
                                  time,
                                  selectedService.durationMinutes,
                                )
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
        <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4">
          <Button
            type="button"
            className="w-full rounded-2xl py-6 text-base font-semibold"
            onClick={() => setStep("details")}
            disabled={!allSessionsSelected}
          >
            {t("public.booking.continueToDetails")}
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
          </div>
          {desktopGrid}
          {mobileGrid}
        </>
      )}
    </>
  );

  const detailsStepContent = (
    <div className="mx-auto max-w-3xl">
      <div className={`${mobileHeroClassName} md:hidden`}>
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
            onClick={() => setStep("pick")}
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

      <div className={`${mobileDrawerClassName} md:hidden`}>
        <div className="mx-auto mt-3 h-1.5 w-14 shrink-0 rounded-full bg-slate-200" />
        <div className="shrink-0 border-b border-slate-100 bg-white px-3 pb-2 pt-1">
          {bookingStepper}
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-2 pt-4">
          <h2 className="mb-1 text-2xl font-bold text-slate-900">{t("public.booking.clientDetailsTitle")}</h2>
          <p className="mb-4 text-sm text-slate-600">{t("public.booking.recapSubtitle")}</p>
          <Form {...bookingClientForm}>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={bookingClientForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("public.booking.firstName")}</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="given-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bookingClientForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("public.booking.lastName")}</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="family-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={bookingClientForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("public.booking.clientEmail")}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" autoComplete="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={bookingClientForm.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <FormControl>
                        <Checkbox checked={field.value === true} onCheckedChange={(value) => field.onChange(value === true)} />
                      </FormControl>
                      <span>{t("public.booking.rememberMe")}</span>
                    </label>
                  </FormItem>
                )}
              />
            </div>
          </Form>

          <div className="mt-5 space-y-3 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/70 to-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-slate-900">{t("public.booking.recapTitle")}</p>
              <p className="text-base font-semibold text-blue-700">{priceLabel}</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm">
              <p className="font-medium text-slate-900">{selectedService?.name ?? ""}</p>
              <p className="mt-0.5 text-slate-600">
                {t("public.booking.durationLabel", { minutes: selectedService?.durationMinutes ?? 0 })} · {servicePackSessionsLabel}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("public.booking.sidebarSelectionsTitle")}
              </p>
              {orderedSelectedSlots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-500">
                  {t("public.booking.noSelectionYet")}
                </div>
              ) : (
                <ul className="max-h-44 space-y-2 overflow-y-auto pr-1">
                  {orderedSelectedSlots.map((slot, idx) => (
                <li
                  key={`${slot.column.dateIso}-${slot.time}-${idx}`}
                  className="rounded-xl border border-blue-100 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{t("public.booking.sessionNumber", { n: idx + 1 })}</p>
                    <p className="mt-0.5 text-sm text-slate-700">
                      {getDayDateLabel(slot.column.fullDate)} · {slot.time}
                    </p>
                  </div>
                </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4">
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" className="w-full rounded-2xl py-6 text-base font-semibold" onClick={() => setStep("pick")}>
              {t("common.back")}
            </Button>
            <Button
              type="button"
              className="w-full rounded-2xl py-6 text-base font-semibold"
              onClick={submitBookingRequest}
              disabled={
                !canSubmitBooking || requestMutation.isPending || createCheckoutSessionMutation.isPending || confirmCheckoutMutation.isPending
              }
              pending={requestMutation.isPending || createCheckoutSessionMutation.isPending || confirmCheckoutMutation.isPending}
              pendingChildren={t("public.booking.submitting")}
            >
              {t("public.booking.submit")}
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6 md:block">
        <h2 className="mb-1 text-2xl font-bold text-slate-900">{t("public.booking.clientDetailsTitle")}</h2>
        <p className="mb-4 text-sm text-slate-600">{t("public.booking.recapSubtitle")}</p>
        <Form {...bookingClientForm}>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={bookingClientForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("public.booking.firstName")}</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="given-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={bookingClientForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("public.booking.lastName")}</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="family-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={bookingClientForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("public.booking.clientEmail")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" autoComplete="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={bookingClientForm.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <FormControl>
                      <Checkbox checked={field.value === true} onCheckedChange={(value) => field.onChange(value === true)} />
                    </FormControl>
                    <span>{t("public.booking.rememberMe")}</span>
                  </label>
                </FormItem>
              )}
            />
          </div>
        </Form>

        <div className="mt-5 space-y-3 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/70 to-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-semibold text-slate-900">{t("public.booking.recapTitle")}</p>
            <p className="text-base font-semibold text-blue-700">{priceLabel}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm">
            <p className="font-medium text-slate-900">{selectedService?.name ?? ""}</p>
            <p className="mt-0.5 text-slate-600">
              {t("public.booking.durationLabel", { minutes: selectedService?.durationMinutes ?? 0 })} · {servicePackSessionsLabel}
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("public.booking.sidebarSelectionsTitle")}
            </p>
            {orderedSelectedSlots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-500">
                {t("public.booking.noSelectionYet")}
              </div>
            ) : (
              <ul className="max-h-44 space-y-2 overflow-y-auto pr-1">
                {orderedSelectedSlots.map((slot, idx) => (
                <li
                  key={`${slot.column.dateIso}-${slot.time}-${idx}`}
                  className="rounded-xl border border-blue-100 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{t("public.booking.sessionNumber", { n: idx + 1 })}</p>
                    <p className="mt-0.5 text-sm text-slate-700">
                      {getDayDateLabel(slot.column.fullDate)} · {slot.time}
                    </p>
                  </div>
                </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setStep("pick")}>
            {t("common.back")}
          </Button>
          <Button
            type="button"
            onClick={submitBookingRequest}
            disabled={
              !canSubmitBooking || requestMutation.isPending || createCheckoutSessionMutation.isPending || confirmCheckoutMutation.isPending
            }
            pending={requestMutation.isPending || createCheckoutSessionMutation.isPending || confirmCheckoutMutation.isPending}
            pendingChildren={t("public.booking.submitting")}
          >
            {t("public.booking.submit")}
          </Button>
        </div>
      </div>
    </div>
  );

  const serviceDetailsStep = selectedService ? (
    <div className="mx-auto w-full max-w-3xl md:max-w-5xl">
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
          {bookingStepper}
          {coach ? <PublicCoachBanner name={coach.name} bio={coach.bio} imageUrl={coach.imageUrl} /> : null}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-2xl font-bold text-slate-900">{selectedService.name}</p>
              {selectedServiceGoogleMapsHref.length > 0 ? (
                <a
                  href={selectedServiceGoogleMapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("public.booking.mapTitle")}
                  className="mt-1 block text-sm font-medium text-blue-600 underline-offset-2 hover:text-blue-800 hover:underline"
                >
                  {selectedService.address}
                </a>
              ) : (
                <p className="mt-1 text-sm text-slate-500">{selectedService.address}</p>
              )}
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

        </div>

        <div className="border-t border-slate-200 bg-white px-5 py-4">
          <Button type="button" className="w-full rounded-2xl py-6 text-base font-semibold" onClick={() => setStep("pick")}>
            {t("public.booking.pickSlotCta")}
          </Button>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-lg shadow-slate-900/[0.05] ring-1 ring-slate-900/[0.03]">
          <div className="flex flex-col gap-4 bg-gradient-to-br from-slate-50/90 via-white to-blue-50/30 px-6 py-5 lg:px-8 lg:py-5">
            {coach ? <PublicCoachBanner name={coach.name} bio={coach.bio} imageUrl={coach.imageUrl} compact /> : null}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600">
                {t("public.booking.stepper.service")}
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 lg:text-2xl">{selectedService.name}</h2>
              {(selectedService.description ?? "").trim().length > 0 ? (
                <p className="mt-2 max-w-3xl text-sm leading-snug text-slate-600 line-clamp-3">{selectedService.description}</p>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/50">
              {selectedService.imageUrl ? (
                <img
                  src={selectedService.imageUrl}
                  alt={selectedService.name}
                  className="h-32 w-full object-cover sm:h-36"
                />
              ) : (
                <div className="flex h-32 items-center justify-center px-4 text-center text-xs text-slate-500 sm:h-36">
                  {selectedService.name}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-800">
                <Clock className="size-3.5 shrink-0 text-blue-600" />
                {t("public.booking.durationLabel", { minutes: selectedService.durationMinutes })}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-800">
                <Package className="size-3.5 shrink-0 text-blue-600" />
                {servicePackSessionsLabel}
              </span>
              {selectedServiceGoogleMapsHref.length > 0 ? (
                <a
                  href={selectedServiceGoogleMapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("public.booking.mapTitle")}
                  className="inline-flex w-full max-w-full items-start gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-800 transition-colors hover:border-blue-300/80 hover:bg-blue-50/90 hover:text-blue-900 sm:w-auto"
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-blue-600" aria-hidden />
                  <span className="line-clamp-2">{selectedService.address}</span>
                </a>
              ) : (
                <span className="inline-flex w-full max-w-full items-start gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-800 sm:w-auto">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-blue-600" aria-hidden />
                  <span className="line-clamp-2">{selectedService.address}</span>
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600">{priceLabel}</p>
              <Button type="button" className="h-10 w-full rounded-lg px-6 text-sm font-semibold sm:w-auto sm:min-w-[200px]" onClick={() => setStep("pick")}>
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
  ) : storefrontQuery.isError && isPublicCoachStorefrontNotFoundError(storefrontQuery.error) ? (
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
  ) : step === "details" ? (
    detailsStepContent
  ) : (
    pickStepContent
  );

  const isBookingShell = step === "service" || step === "pick" || step === "details";

  const bookingShellBackdrop = (
    <div className="pointer-events-none absolute inset-0 -z-0 hidden overflow-hidden md:block" aria-hidden>
      <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-blue-400/18 blur-3xl" />
      <div className="absolute right-0 top-40 h-64 w-64 rounded-full bg-indigo-400/14 blur-3xl" />
      <div className="absolute bottom-10 left-1/2 h-48 w-[28rem] -translate-x-1/2 rounded-full bg-cyan-400/12 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='0.18'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );

  return (
    <FrontOfficePageLayout
      rootClassName={
        isBookingShell
          ? "min-h-screen bg-black px-0 py-0 md:bg-slate-50 md:px-2 md:py-4 lg:px-3"
          : "min-h-screen bg-slate-50 px-6 py-12"
      }
      hideBrandOnMobile={isBookingShell}
      topAction={
        step === "done" || isBookingShell ? null : <BackButton label={t("common.back")} fallbackHref={servicesHref} />
      }
    >
      <div className={isBookingShell ? "relative mx-auto w-full max-w-[1600px] pt-0 md:pt-3" : "mx-auto max-w-5xl pt-8"}>
        {isBookingShell ? (
          <>
            {bookingShellBackdrop}
            <div className="relative z-10">
              <div className="mb-4 hidden md:block">{bookingStepper}</div>
              {mainInner}
            </div>
          </>
        ) : (
          mainInner
        )}
      </div>
    </FrontOfficePageLayout>
  );
}
