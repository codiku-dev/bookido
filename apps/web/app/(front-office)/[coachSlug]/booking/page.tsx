"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Check, ChevronLeft, Clock, MapPin, Share2 } from "lucide-react";
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
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { trpc } from "@web/libs/trpc-client";
import { DEFAULT_CALENDAR_WEEK_HOURS, type WeekHours } from "#/utils/calendar-availability";
import {
  BOOKING_PAGE_GRID_SLOTS,
  buildEnabledDayColumns,
  buildOccupiedSlotKeySet,
  computeVisibleTimeSlots,
  getCalendarWeekDates,
  isSlotSelectableForService,
  type BookingPageDayColumn,
} from "#/utils/booking-page-calendar";
import { buildCalendarSlotKey } from "#/utils/calendar-availability";

type SelectedSlot = {
  column: BookingPageDayColumn;
  time: string;
};

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

  const serviceIdParam = searchParams.get("service")?.trim() ?? "";

  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [step, setStep] = useState<"service" | "pick" | "done">("service");
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [mobileHeroImageIndex, setMobileHeroImageIndex] = useState(0);
  const [mobilePickerMonthAnchor, setMobilePickerMonthAnchor] = useState(() => new Date());
  const [mobileMonthSelectOpen, setMobileMonthSelectOpen] = useState(false);
  const [mobileYearSelectOpen, setMobileYearSelectOpen] = useState(false);
  const [mobilePickerOpenDayKey, setMobilePickerOpenDayKey] = useState<string | null>(null);

  const weekDates = useMemo(() => getCalendarWeekDates(weekAnchor), [weekAnchor]);

  const rangeInput = useMemo(() => {
    const from = new Date(mobilePickerMonthAnchor.getFullYear(), mobilePickerMonthAnchor.getMonth(), 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(mobilePickerMonthAnchor.getFullYear(), mobilePickerMonthAnchor.getMonth() + 1, 0);
    to.setHours(23, 59, 59, 999);
    return { rangeFrom: from.toISOString(), rangeTo: to.toISOString() };
  }, [mobilePickerMonthAnchor]);

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
  const minStartDateMs = useMemo(() => Date.now() + minBookingNoticeHours * 60 * 60 * 1000, [minBookingNoticeHours]);

  const selectedService = useMemo(() => {
    if (services.length === 0) {
      return null;
    }
    const byParam = serviceIdParam ? services.find((s) => s.id === serviceIdParam) : undefined;
    return byParam ?? services[0] ?? null;
  }, [services, serviceIdParam]);

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

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }), [locale]);
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

  const isCellBlocked = (column: BookingPageDayColumn, time: string, occupiedSlotKeys: Set<string>) => {
    if (!selectedService) {
      return true;
    }
    const startsAt = toSlotStartDate(column, time);
    if (startsAt.getTime() < minStartDateMs) {
      return true;
    }
    const key = buildCalendarSlotKey(column.dayKey, time);
    if (occupiedSlotKeys.has(key)) {
      return true;
    }
    if (
      !isSlotSelectableForService({
        column,
        startTime: time,
        serviceDurationMinutes: selectedService.durationMinutes,
        allTimeSlots: BOOKING_PAGE_GRID_SLOTS,
        weekHours,
        closedSlotKeys: closedSet,
        occupiedSlotKeys,
      })
    ) {
      return true;
    }
    return false;
  };

  const handlePickSlot = (column: BookingPageDayColumn, time: string) => {
    if (isCellBlocked(column, time, occupiedKeys)) {
      return;
    }
    setSelectedSlot({ column, time });
  };

  const submitBookingRequest = () => {
    if (!slugOk || !selectedService || !selectedSlot) {
      return;
    }
    const startsAt = new Date(`${selectedSlot.column.dateIso}T${selectedSlot.time}:00`).toISOString();
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    requestMutation.mutate({
      coachSlug: coachSlugKey,
      serviceId: selectedService.id,
      startsAt,
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

  const desktopGrid = (
    <div className="hidden gap-6 lg:grid lg:grid-cols-[1fr_280px]">
      <div className="overflow-x-auto rounded-2xl bg-white p-6 shadow-lg">
        <div style={{ minWidth: `${enabledColumns.length * 72 + 56}px` }}>
          <div
            className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200"
            style={{
              gridTemplateColumns: `56px repeat(${enabledColumns.length}, minmax(0, 1fr))`,
            }}
          >
            <div className="bg-slate-50" />
            {enabledColumns.map((col) => (
              <div key={col.dateIso} className="bg-slate-50 p-3 text-center">
                <div className="text-sm font-medium text-slate-900">{getDayShortLabel(col.dayKey)}</div>
                <div className="text-xs text-slate-500">{getDayDateLabel(col.fullDate)}</div>
              </div>
            ))}
            {visibleSlots.map((time) => (
              <Fragment key={time}>
                <div className="flex items-center justify-end bg-white px-2 py-2">
                  <span className="text-xs text-slate-600">{time}</span>
                </div>
                {enabledColumns.map((col) => {
                  const blocked = isCellBlocked(col, time, occupiedKeys);
                  const selected =
                    selectedSlot?.column.dateIso === col.dateIso && selectedSlot.time === time && selectedSlot.column.dayKey === col.dayKey;
                  return (
                    <button
                      key={`${col.dateIso}-${time}`}
                      type="button"
                      disabled={blocked}
                      onClick={() => handlePickSlot(col, time)}
                      className={`min-h-10 p-2 transition-colors ${
                        blocked
                          ? "cursor-not-allowed bg-slate-100 opacity-50"
                          : selected
                            ? "bg-blue-600 text-white"
                            : "bg-white hover:bg-blue-50"
                      }`}
                    >
                      {!blocked && selected ? <Check className="mx-auto size-4" /> : null}
                    </button>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="mb-2 font-bold text-slate-900">{t("public.payment.slots")}</h3>
        {selectedService ? (
          <p className="mb-4 text-sm text-slate-600">
            {selectedService.name} · {t("public.booking.durationLabel", { minutes: selectedService.durationMinutes })} · {priceLabel}
          </p>
        ) : null}
        {!selectedSlot ? (
          <p className="py-8 text-center text-sm text-slate-500">{t("public.booking.pickSlotSubtitle")}</p>
        ) : (
          <>
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-slate-800">
              <div className="font-medium">{getDayShortLabel(selectedSlot.column.dayKey)}</div>
              <div className="text-slate-600">
                {getDayDateLabel(selectedSlot.column.fullDate)} · {selectedSlot.time}
              </div>
            </div>
            <Button
              type="button"
              className="w-full rounded-xl"
              onClick={submitBookingRequest}
              disabled={requestMutation.isPending}
              pending={requestMutation.isPending}
              pendingChildren={t("public.booking.submitting")}
            >
              {t("public.booking.submit")}
            </Button>
          </>
        )}
      </div>
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
  const monthLabelFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long" }),
    [locale],
  );
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
        const monthDate = new Date(2026, idx, 1);
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
        slots: BOOKING_PAGE_GRID_SLOTS.filter((time) => !isCellBlocked(column, time, mobileOccupiedKeys)),
      }))
      .filter((day) => day.slots.length > 0),
    [mobileDayColumns, fullDateFormatter, mobileOccupiedKeys],
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
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 justify-center rounded-xl"
              onClick={() => setMobileMonthSelectOpen(true)}
            >
              {mobileMonthLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 justify-center rounded-xl"
              onClick={() => setMobileYearSelectOpen(true)}
            >
              {mobileYearLabel}
            </Button>
          </div>
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
                                selectedSlot?.column.dateIso === day.column.dateIso &&
                                selectedSlot.time === time &&
                                selectedSlot.column.dayKey === day.column.dayKey
                                  ? "default"
                                  : "outline"
                              }
                              className="rounded-xl"
                              onClick={() => {
                                setSelectedSlot({ column: day.column, time });
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
            disabled={!selectedSlot || requestMutation.isPending}
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
                  setSelectedSlot(null);
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
                  setSelectedSlot(null);
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
                <MapPin className="size-4 text-slate-500" />
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

  const servicesHref = `/${coachSlug}/services`;

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
          ? "min-h-screen bg-black px-0 py-0 md:bg-slate-50 md:px-6 md:py-12"
          : "min-h-screen bg-slate-50 px-6 py-12"
      }
      hideBrandOnMobile={step === "service" || step === "pick"}
      topAction={
        step === "done" || step === "service" || step === "pick" ? null : <BackButton label={t("common.back")} fallbackHref={servicesHref} />
      }
    >
      <div className={step === "service" || step === "pick" ? "mx-auto max-w-5xl pt-0 md:pt-8" : "mx-auto max-w-5xl pt-8"}>{mainInner}</div>
    </FrontOfficePageLayout>
  );
}
