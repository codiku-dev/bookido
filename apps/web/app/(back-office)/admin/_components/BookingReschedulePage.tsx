"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import CalendarView, { type RescheduleSlotSelection } from "./CalendarView";
import { useLanguage } from "#/components/use-language";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { trpc } from "@web/libs/trpc-client";
import { bookingLocalTimeHm } from "#/utils/booking-dates";
import { formatDayMonth } from "#/utils/dateFormat";
import { getCalendarDayKeyFromDate } from "#/utils/calendar-availability";

export default function BookingReschedulePage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const utils = trpc.useUtils();
  const params = useParams<{ id: string }>();
  const rawId = params.id;
  const bookingId =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) && rawId[0] !== undefined ? rawId[0] : "";

  const [pendingSlot, setPendingSlot] = useState<RescheduleSlotSelection | null>(null);

  const postReschedulePath =
    searchParams.get("returnTo") === "/admin/calendar" ? "/admin/calendar" : "/admin/bookings";

  const bookingQuery = trpc.bookings.getById.useQuery(
    { id: bookingId },
    { enabled: bookingId.length > 0, retry: false },
  );

  const updateMutation = trpc.bookings.update.useMutation({
    onSuccess: async () => {
      toast.success(t("booking.reschedule.toast.success"));
      await utils.bookings.list.invalidate();
      await utils.bookings.getById.invalidate({ id: bookingId });
      setPendingSlot(null);
      router.push(postReschedulePath);
    },
    onError: () => {
      toast.error(t("booking.reschedule.toast.error"));
    },
  });

  const booking = bookingQuery.data ?? null;

  const anchorDate = useMemo(() => {
    if (!booking?.startsAt) {
      return null;
    }
    return new Date(booking.startsAt);
  }, [booking?.startsAt]);

  const currentSlotSummary = useMemo(() => {
    if (!booking) {
      return null;
    }
    const start = new Date(booking.startsAt);
    const dayKey = getCalendarDayKeyFromDate(start);
    return {
      day: t(`public.time.days.${dayKey}.short`),
      date: formatDayMonth(start, locale),
      time: bookingLocalTimeHm(start),
      client: booking.clientName,
      service: booking.serviceName,
    };
  }, [booking, locale, t]);

  const handleRescheduleSlot = (slot: RescheduleSlotSelection) => {
    setPendingSlot(slot);
  };

  const handleConfirmReschedule = () => {
    if (!booking || !pendingSlot) {
      return;
    }
    const startsAt = new Date(`${pendingSlot.dateIso}T${pendingSlot.time}:00`).toISOString();
    updateMutation.mutate({ id: bookingId, data: { startsAt } });
  };

  const pendingDayLabel = pendingSlot ? t(`public.time.days.${pendingSlot.dayKey}.short`) : "";

  const backButton = (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 -ml-1 mb-6"
    >
      <ArrowLeft className="w-4 h-4 shrink-0" />
      {t("common.back")}
    </button>
  );

  const headerCard = currentSlotSummary && (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("booking.reschedule.page.title")}</h1>
      <p className="text-slate-600">{t("booking.reschedule.page.subtitle")}</p>
      <div className="mt-4 text-sm text-slate-700">
        {t("booking.reschedule.page.currentSlot", {
          client: currentSlotSummary.client,
          service: currentSlotSummary.service,
          day: currentSlotSummary.day,
          date: currentSlotSummary.date,
          time: currentSlotSummary.time,
        })}
      </div>
    </div>
  );

  const slotHint = (
    <div className="mt-4 text-sm text-slate-600">
      {pendingSlot
        ? t("booking.reschedule.page.selectedSlot", {
            day: pendingDayLabel,
            date: pendingSlot.dateLabel,
            time: pendingSlot.time,
          })
        : t("booking.reschedule.page.selectPrompt")}
    </div>
  );

  const confirmDialog = (
    <Dialog open={Boolean(pendingSlot)} onOpenChange={(open) => !open && setPendingSlot(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("booking.reschedule.modal.title")}</DialogTitle>
        </DialogHeader>
        {pendingSlot ? (
          <p className="text-slate-600 text-sm">
            {t("booking.reschedule.page.confirmPrompt", {
              day: pendingDayLabel,
              date: pendingSlot.dateLabel,
              time: pendingSlot.time,
            })}
          </p>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setPendingSlot(null)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleConfirmReschedule} disabled={updateMutation.isPending}>
            {t("booking.reschedule.modal.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const loadingBlock = (
    <div className="p-8">
      <div className="max-w-6xl mx-auto min-h-[40vh] flex items-center justify-center text-slate-600 text-sm">
        {t("booking.list.loading")}
      </div>
    </div>
  );

  const notFoundBlock = (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {backButton}
        <p className="text-slate-700">{t("booking.reschedule.notFound")}</p>
        <Button type="button" variant="link" className="px-0" onClick={() => router.push("/admin/bookings")}>
          {t("booking.list.title")}
        </Button>
      </div>
    </div>
  );

  if (bookingQuery.isLoading) {
    return loadingBlock;
  }

  if (!bookingId.length || bookingQuery.isError || !booking) {
    return notFoundBlock;
  }

  const calendarSection = (
    <>
      <CalendarView
        mode="reschedule"
        rescheduleBookingId={bookingId}
        rescheduleAnchorDate={anchorDate}
        onRescheduleSlotSelect={handleRescheduleSlot}
      />
      {slotHint}
    </>
  );

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {backButton}
        {headerCard}
        {calendarSection}
      </div>
      {confirmDialog}
    </div>
  );
}
