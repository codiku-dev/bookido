"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@repo/trpc/router";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Clock,
  Calendar,
  MapPin,
  MessageCircle,
  CalendarIcon,
  XCircle,
  MoreVertical,
  RotateCcw,
  ShieldAlert,
  Wallet,
} from "lucide-react";

import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { useLanguage } from "#/components/use-language";
import { formatShortDate } from "#/utils/dateFormat";
import { bookingLocalTimeHm, getBookingAmountRemaining, paymentKindFromAmounts } from "#/utils/booking-dates";
import { trpc } from "@web/libs/trpc-client";

type BookingRow = inferRouterOutputs<AppRouter>["bookings"]["getById"];
type BookingStatus = BookingRow["status"];
type PaymentKind = ReturnType<typeof paymentKindFromAmounts>;

export default function BookingDetail() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const { locale } = useLanguage();
  const utils = trpc.useUtils();

  const rawId = params["id"];
  const bookingId =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) && rawId[0] !== undefined ? rawId[0] : "";

  const bookingQuery = trpc.bookings.getById.useQuery(
    { id: bookingId },
    { enabled: bookingId.length > 0, retry: false },
  );

  const updateMutation = trpc.bookings.update.useMutation({
    onSuccess: async () => {
      await utils.bookings.getById.invalidate({ id: bookingId });
      await utils.bookings.list.invalidate();
    },
  });

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markPaidInput, setMarkPaidInput] = useState("");
  const [markPaidError, setMarkPaidError] = useState<string | null>(null);

  const booking = bookingQuery.data ?? null;

  const getStatusBadgeClass = (status: BookingStatus) => {
    if (status === "confirmed") return "bg-green-50 text-green-700";
    if (status === "pending") return "bg-yellow-50 text-yellow-700";
    return "bg-red-50 text-red-700";
  };

  const getStatusLabel = (status: BookingStatus) => {
    if (status === "confirmed") return t("user.detail.status.confirmed");
    if (status === "pending") return t("booking.list.status.pending");
    return t("user.detail.status.cancelled");
  };

  const getPaymentBadgeClass = (payment: PaymentKind) => {
    if (payment === "paid") return "bg-emerald-50 text-emerald-700";
    if (payment === "partial") return "bg-amber-50 text-amber-800";
    return "bg-slate-100 text-slate-600";
  };

  const getPaymentLabel = (payment: PaymentKind) => {
    if (payment === "paid") return t("booking.list.payment.paid");
    if (payment === "partial") return t("booking.list.payment.partial");
    return t("booking.list.payment.unpaid");
  };

  if (bookingQuery.isLoading) {
    return <div className="p-8" />;
  }

  if (!bookingId.length || bookingQuery.isError || !booking) {
    return (
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 -ml-1"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {t("common.back")}
          </button>
          <p className="text-slate-700">{t("booking.detail.notFound")}</p>
          <button
            type="button"
            onClick={() => router.push("/admin/bookings")}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            {t("booking.create.back")}
          </button>
        </div>
      </div>
    );
  }

  const needsValidationBanner = booking.requiresHostValidation && !booking.hostValidationAccepted;
  const dateLabel = formatShortDate(booking.startsAt, locale);
  const timeLabel = bookingLocalTimeHm(booking.startsAt);
  const durationLabel = t("services.durationValue", { minutes: booking.durationMinutes });
  const contactMailHref = `mailto:${booking.clientEmail}?subject=${encodeURIComponent(`Booking ${booking.id} - ${booking.serviceName}`)}`;
  const payment = paymentKindFromAmounts(booking.paidAmount, booking.price);

  const handleAcceptHostValidation = () => {
    updateMutation.mutate({
      id: booking.id,
      data: {
        hostValidationAccepted: true,
        status: "confirmed",
      },
    });
  };

  const handleMarkAwaitingValidation = () => {
    updateMutation.mutate({
      id: booking.id,
      data: {
        hostValidationAccepted: false,
        status: "pending",
      },
    });
  };

  const outstanding = getBookingAmountRemaining(booking.paidAmount, booking.price);
  const canRecordPayment = outstanding > 0;

  const handleConfirmMarkPaid = () => {
    const parsed = Number.parseFloat(markPaidInput.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMarkPaidError(t("booking.detail.markPaid.invalid"));
      return;
    }
    const rem = getBookingAmountRemaining(booking.paidAmount, booking.price);
    if (parsed > rem + 1e-6) {
      setMarkPaidError(t("booking.detail.markPaid.tooHigh"));
      return;
    }
    const newPaid = Math.round((booking.paidAmount + parsed) * 100) / 100;
    updateMutation.mutate({
      id: booking.id,
      data: { paidAmount: newPaid },
    });
    setMarkPaidOpen(false);
    setMarkPaidError(null);
  };

  const handleConfirmCancel = () => {
    updateMutation.mutate(
      { id: booking.id, data: { status: "cancelled" } },
      {
        onSuccess: async () => {
          setIsCancelModalOpen(false);
          await utils.bookings.list.invalidate();
          router.push("/admin/bookings");
        },
      },
    );
  };

  const validationPendingBanner = needsValidationBanner ? (
    <Alert
      className="mb-6 border-amber-200 bg-amber-50 text-amber-950 [&>svg]:text-amber-600"
      role="status"
    >
      <ShieldAlert className="size-4 shrink-0" aria-hidden />
      <AlertDescription className="text-amber-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="font-medium leading-snug">{t("booking.detail.validationPending.message")}</p>
          <Button type="button" size="sm" className="shrink-0 sm:self-start" onClick={handleAcceptHostValidation}>
            {t("booking.detail.validationPending.accept")}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  ) : null;

  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label={t("booking.detail.moreActions")}>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuItem asChild>
          <a href={contactMailHref} className="cursor-pointer">
            <MessageCircle className="size-4" />
            {t("booking.detail.contact")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            router.push(`/admin/bookings/${booking.id}/reschedule`);
          }}
        >
          <CalendarIcon className="size-4" />
          {t("booking.detail.reschedule")}
        </DropdownMenuItem>
        {canRecordPayment ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                const rem = getBookingAmountRemaining(booking.paidAmount, booking.price);
                window.setTimeout(() => {
                  setMarkPaidInput(rem > 0 ? String(rem) : "");
                  setMarkPaidError(null);
                  setMarkPaidOpen(true);
                }, 0);
              }}
            >
              <Wallet className="size-4" />
              {t("booking.detail.markPaid.menu")}
            </DropdownMenuItem>
          </>
        ) : null}
        {booking.requiresHostValidation && booking.hostValidationAccepted ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                handleMarkAwaitingValidation();
              }}
            >
              <RotateCcw className="size-4" />
              {t("booking.detail.markAwaitingValidation")}
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            setIsCancelModalOpen(true);
          }}
        >
          <XCircle className="size-4" />
          {t("booking.detail.cancel")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const pageTopBar = (
    <div className="mb-6 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 -ml-1"
      >
        <ArrowLeft className="w-4 h-4 shrink-0" />
        {t("common.back")}
      </button>
      {actionsMenu}
    </div>
  );

  const mainInfoCard = (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 mb-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{booking.serviceName}</h1>
          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {dateLabel}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {timeLabel} ({durationLabel})
            </div>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 px-4 py-2 rounded-full text-sm font-medium self-start ${getStatusBadgeClass(booking.status)}`}
        >
          {getStatusLabel(booking.status)}
        </span>
      </div>

      <div className="pt-6 border-t border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">{t("booking.detail.client.info")}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-sm text-slate-600">{t("booking.detail.clientLabel")}</div>
              <div className="font-medium text-slate-900">{booking.clientName}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-sm text-slate-600">{t("users.email")}</div>
              <div className="font-medium text-slate-900">{booking.clientEmail}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-sm text-slate-600">{t("users.phone")}</div>
              <div className="font-medium text-slate-900">{booking.clientPhone}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-sm text-slate-600">{t("user.detail.address")}</div>
              <div className="font-medium text-slate-900">{booking.location.length ? booking.location : "—"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const paymentCard = (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="font-bold text-slate-900 mb-4">{t("booking.detail.payment.info")}</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-slate-600">{t("booking.detail.payment.method")}</span>
          <span className="font-medium text-slate-900">{booking.paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">{t("booking.detail.payment.status")}</span>
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentBadgeClass(payment)}`}>
            {getPaymentLabel(payment)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">{t("booking.detail.payment.total")}</span>
          <span className="font-bold text-blue-600">€{booking.price}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">{t("booking.detail.payment.paidSoFar")}</span>
          <span className="font-medium text-slate-900">€{booking.paidAmount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">{t("booking.detail.payment.remaining")}</span>
          <span className="font-medium text-slate-900">€{outstanding}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">{t("booking.detail.payment.directTitle")}</span>
          <span className="font-medium text-slate-900">
            {booking.allowsDirectPayment ? t("booking.detail.payment.directYes") : t("booking.detail.payment.directNo")}
          </span>
        </div>
      </div>
    </div>
  );

  const notesText = booking.notes?.trim().length ? booking.notes : "—";

  const notesCard = (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="font-bold text-slate-900 mb-4">{t("booking.detail.notes")}</h3>
      <p className="text-slate-700">{notesText}</p>
    </div>
  );

  const markPaidDialog = (
    <Dialog
      open={markPaidOpen}
      onOpenChange={(open) => {
        setMarkPaidOpen(open);
        if (!open) setMarkPaidError(null);
      }}
    >
      <DialogContent className="bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("booking.detail.markPaid.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="mark-paid-amount">{t("booking.detail.markPaid.amountLabel")}</Label>
            <Input
              id="mark-paid-amount"
              type="text"
              inputMode="decimal"
              value={markPaidInput}
              onChange={(e) => {
                const next = e.target.value.replace(",", ".").replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
                setMarkPaidInput(next);
                setMarkPaidError(null);
              }}
              className="rounded-xl h-11"
            />
          </div>
          <p className="text-xs text-slate-500">{t("booking.detail.markPaid.hint", { remaining: outstanding })}</p>
          {markPaidError ? <p className="text-sm text-red-600">{markPaidError}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setMarkPaidOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleConfirmMarkPaid}>
            {t("booking.detail.markPaid.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const cancelModal = isCancelModalOpen && (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-2">{t("booking.detail.cancelConfirm.title")}</h3>
          <p className="text-slate-600">{t("booking.detail.cancelConfirm.description")}</p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            onClick={() => setIsCancelModalOpen(false)}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
          >
            {t("booking.detail.cancel")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {pageTopBar}
        {validationPendingBanner}
        {mainInfoCard}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {paymentCard}
          {notesCard}
        </div>
      </div>
      {markPaidDialog}
      {cancelModal}
    </div>
  );
}
