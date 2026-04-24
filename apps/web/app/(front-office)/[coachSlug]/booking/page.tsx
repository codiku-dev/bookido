"use client";

import { Fragment, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { BackButton } from "../../_components/BackButton";
import { FrontOfficePageLayout } from "../../_components/FrontOfficePageLayout";
import { PublicCoachBanner } from "../../_components/PublicCoachBanner";
import { Button } from "#/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
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

function useWeekRangeTitle(weekDates: Date[], locale: string) {
  return useMemo(() => {
    const first = weekDates[0]!;
    const last = weekDates[6]!;
    const df = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" });
    return `${df.format(first)} – ${df.format(last)}`;
  }, [weekDates, locale]);
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
  const [step, setStep] = useState<"pick" | "details" | "done">("pick");
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const weekDates = useMemo(() => getCalendarWeekDates(weekAnchor), [weekAnchor]);

  const rangeInput = useMemo(() => {
    const d0 = weekDates[0]!;
    const d6 = weekDates[6]!;
    const from = new Date(d0);
    from.setHours(0, 0, 0, 0);
    const to = new Date(d6);
    to.setHours(23, 59, 59, 999);
    return { rangeFrom: from.toISOString(), rangeTo: to.toISOString() };
  }, [weekDates]);

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

  const selectedService = useMemo(() => {
    if (services.length === 0) {
      return null;
    }
    const byParam = serviceIdParam ? services.find((s) => s.id === serviceIdParam) : undefined;
    return byParam ?? services[0] ?? null;
  }, [services, serviceIdParam]);

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
      } else {
        toast.error(t("public.booking.error"));
      }
    },
  });

  const clientFormSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("public.booking.validation.name")),
        email: z.string().email(t("public.booking.validation.email")),
        phone: z.string().optional(),
      }),
    [t],
  );

  type ClientFormValues = z.infer<typeof clientFormSchema>;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  const navigateWeek = (dir: "prev" | "next") => {
    const next = new Date(weekAnchor);
    next.setDate(weekAnchor.getDate() + (dir === "next" ? 7 : -7));
    setWeekAnchor(next);
    setSelectedSlot(null);
  };

  const isCellBlocked = (column: BookingPageDayColumn, time: string) => {
    if (!selectedService) {
      return true;
    }
    const key = buildCalendarSlotKey(column.dayKey, time);
    if (occupiedKeys.has(key)) {
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
        occupiedSlotKeys: occupiedKeys,
      })
    ) {
      return true;
    }
    return false;
  };

  const handlePickSlot = (column: BookingPageDayColumn, time: string) => {
    if (isCellBlocked(column, time)) {
      return;
    }
    setSelectedSlot({ column, time });
  };

  const onSubmitDetails = form.handleSubmit((values) => {
    if (!slugOk || !selectedService || !selectedSlot) {
      return;
    }
    const startsAt = new Date(`${selectedSlot.column.dateIso}T${selectedSlot.time}:00`).toISOString();
    requestMutation.mutate({
      coachSlug: coachSlugKey,
      serviceId: selectedService.id,
      startsAt,
      clientName: values.name.trim(),
      clientEmail: values.email.trim(),
      clientPhone: values.phone?.trim() || undefined,
    });
  });

  const weekTitle = useWeekRangeTitle(weekDates, locale);
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

  const weekControls = (
    <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
      <Button type="button" variant="outline" size="icon-sm" onClick={() => navigateWeek("prev")} aria-label={t("public.booking.weekPrev")}>
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-[200px] text-center text-sm font-medium text-slate-800">{weekTitle}</span>
      <Button type="button" variant="outline" size="icon-sm" onClick={() => navigateWeek("next")} aria-label={t("public.booking.weekNext")}>
        <ChevronRight className="size-4" />
      </Button>
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
                  const blocked = isCellBlocked(col, time);
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
              onClick={() => {
                setStep("details");
                form.reset({ name: "", email: "", phone: "" });
              }}
            >
              {t("public.booking.continueToDetails")}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const mobileDayColumns = enabledColumns;

  const mobileGrid = (
    <div className="space-y-6 lg:hidden">
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 font-bold text-slate-900">{t("public.mobile.select.day")}</h3>
        <div className="grid grid-cols-2 gap-3">
          {mobileDayColumns.map((col) => {
            const active = selectedDayKey === col.dateIso;
            return (
              <button
                key={col.dateIso}
                type="button"
                onClick={() => setSelectedDayKey(col.dateIso)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  active ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="font-bold text-slate-900">{getDayShortLabel(col.dayKey)}</div>
                <div className="text-sm text-slate-600">{getDayDateLabel(col.fullDate)}</div>
              </button>
            );
          })}
        </div>
      </div>
      {selectedDayKey ? (
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 font-bold text-slate-900">{t("public.mobile.select.time")}</h3>
          <div className="grid grid-cols-3 gap-2">
            {visibleSlots.map((time) => {
              const col = mobileDayColumns.find((c) => c.dateIso === selectedDayKey);
              if (!col) {
                return null;
              }
              const blocked = isCellBlocked(col, time);
              const selected =
                selectedSlot?.column.dateIso === col.dateIso && selectedSlot.time === time && selectedSlot.column.dayKey === col.dayKey;
              return (
                <button
                  key={time}
                  type="button"
                  disabled={blocked}
                  onClick={() => handlePickSlot(col, time)}
                  className={`rounded-xl px-2 py-3 text-sm ${
                    blocked
                      ? "cursor-not-allowed bg-slate-100 text-slate-300"
                      : selected
                        ? "bg-blue-600 font-medium text-white"
                        : "border-2 border-slate-200 bg-slate-50 hover:border-blue-300"
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {selectedSlot ? (
        <Button type="button" className="w-full rounded-xl" onClick={() => setStep("details")}>
          {t("public.booking.continueToDetails")}
        </Button>
      ) : null}
    </div>
  );

  const coachBannerPick = coach ? <PublicCoachBanner name={coach.name} bio={coach.bio} imageUrl={coach.imageUrl} /> : null;

  const detailsForm = (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
      {coach ? <PublicCoachBanner name={coach.name} bio={coach.bio} imageUrl={coach.imageUrl} /> : null}
      <h2 className="mb-4 text-xl font-bold text-slate-900">{t("public.booking.detailsTitle")}</h2>
      {selectedSlot && selectedService ? (
        <p className="mb-6 text-sm text-slate-600">
          {selectedService.name} — {getDayShortLabel(selectedSlot.column.dayKey)} {getDayDateLabel(selectedSlot.column.fullDate)} ·{" "}
          {selectedSlot.time}
        </p>
      ) : null}
      <Form {...form}>
        <form onSubmit={onSubmitDetails} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("public.booking.clientName")}</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("public.booking.clientEmail")}</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("public.booking.clientPhone")}</FormLabel>
                <FormControl>
                  <Input type="tel" autoComplete="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("pick")}>
              {t("common.back")}
            </Button>
            <Button type="submit" className="flex-1" pending={requestMutation.isPending} pendingChildren={t("public.booking.submitting")}>
              {t("public.booking.submit")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );

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
      {coachBannerPick}
      <h2 className="mb-2 text-center text-3xl font-bold text-slate-900">{t("public.booking.calendarTitle")}</h2>
      <p className="mb-2 text-center text-slate-600">{selectedService?.name ?? ""}</p>
      {weekControls}
      {storefrontQuery.isLoading ? (
        loadingBlock
      ) : enabledColumns.length === 0 ? (
        <p className="py-12 text-center text-slate-600">{t("public.booking.noEnabledDays")}</p>
      ) : visibleSlots.length === 0 ? (
        <p className="py-12 text-center text-slate-600">{t("public.booking.noVisibleSlots")}</p>
      ) : (
        <>
          {desktopGrid}
          {mobileGrid}
        </>
      )}
    </>
  );

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
  ) : step === "details" ? (
    detailsForm
  ) : (
    pickStepContent
  );

  return (
    <FrontOfficePageLayout
      rootClassName="min-h-screen bg-slate-50 px-6 py-12"
      topAction={
        step === "done" ? null : <BackButton label={t("common.back")} fallbackHref={servicesHref} />
      }
    >
      <div className="mx-auto max-w-5xl pt-8">{mainInner}</div>
    </FrontOfficePageLayout>
  );
}
