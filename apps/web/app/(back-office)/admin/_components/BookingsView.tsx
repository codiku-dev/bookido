"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FilterX, NotebookText, Plus, Search } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@repo/trpc/router";
import { LocaleDatePicker } from "#/components/LocaleDatePicker";
import { Button } from "#/components/ui/button";
import { useLanguage } from "#/components/use-language";
import { formatShortDate } from "#/utils/dateFormat";
import { bookingLocalDateKey, bookingLocalTimeHm, paymentKindFromAmounts } from "#/utils/booking-dates";
import { trpc } from "@web/libs/trpc-client";
import { useSession } from "@web/libs/auth-client";

type BookingRow = inferRouterOutputs<AppRouter>["bookings"]["list"][number];
type BookingStatus = BookingRow["status"];
type PaymentKind = ReturnType<typeof paymentKindFromAmounts>;

export default function BookingsView() {
  const t = useTranslations();
  const router = useRouter();
  const { locale } = useLanguage();
  const utils = trpc.useUtils();
  const { data: sessionPayload, isPending: sessionPending } = useSession();
  const sessionReady = !sessionPending && Boolean(sessionPayload?.user);

  const listQuery = trpc.bookings.list.useQuery({}, { retry: false, enabled: sessionReady });

  const markBookingsListViewedMutation = trpc.bookings.markBookingsListViewed.useMutation({
    onSuccess: async () => {
      await utils.bookings.clientBadgeCount.invalidate();
    },
  });

  useEffect(() => {
    if (!sessionReady) {
      return;
    }
    markBookingsListViewedMutation.mutate({});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when session becomes ready; mutation fn is stable enough
  }, [sessionReady]);

  const updateMutation = trpc.bookings.update.useMutation({
    onSuccess: async () => {
      await utils.bookings.list.invalidate();
    },
  });

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"" | PaymentKind>("");
  const [statusFilter, setStatusFilter] = useState<"" | BookingStatus>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const bookingRows = listQuery.data ?? [];

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

  const hasActiveFilters =
    search.trim().length > 0 ||
    paymentFilter !== "" ||
    statusFilter !== "" ||
    dateFrom.length > 0 ||
    dateTo.length > 0;

  const clearFilters = () => {
    setSearch("");
    setPaymentFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookingRows.filter((b) => {
      if (q.length > 0) {
        const matchesSearch =
          b.clientName.toLowerCase().includes(q) ||
          b.serviceName.toLowerCase().includes(q) ||
          b.price.toString().includes(q);
        if (!matchesSearch) return false;
      }
      const pay = paymentKindFromAmounts(b.paidAmount, b.price);
      if (paymentFilter && pay !== paymentFilter) return false;
      if (statusFilter && b.status !== statusFilter) return false;
      const dk = bookingLocalDateKey(b.startsAt);
      if (dateFrom && dk < dateFrom) return false;
      if (dateTo && dk > dateTo) return false;
      return true;
    });
  }, [bookingRows, search, paymentFilter, statusFilter, dateFrom, dateTo]);

  const handleValidateBooking = (bookingId: string) => {
    const target = bookingRows.find((b) => b.id === bookingId);
    updateMutation.mutate({
      id: bookingId,
      data: {
        status: "confirmed",
        paidAmount: target?.price ?? 0,
        hostValidationAccepted: true,
      },
    });
  };

  const canQuickValidateFromList = (b: BookingRow) =>
    b.status === "pending" && !(b.requiresHostValidation && !b.hostValidationAccepted);

  const selectClass =
    "w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600";
  const datePickerClass =
    "rounded-lg border-slate-200 bg-white hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-600";

  const filtersPanel = (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("booking.list.search.placeholder")}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
        <div className="flex flex-col gap-1">
          <label htmlFor="booking-filter-payment" className="text-xs font-medium text-slate-500">
            {t("booking.list.columns.payment")}
          </label>
          <select
            id="booking-filter-payment"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value === "" ? "" : (e.target.value as PaymentKind))}
            className={selectClass}
          >
            <option value="" />
            <option value="paid">{t("booking.list.payment.paid")}</option>
            <option value="partial">{t("booking.list.payment.partial")}</option>
            <option value="unpaid">{t("booking.list.payment.unpaid")}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="booking-filter-status" className="text-xs font-medium text-slate-500">
            {t("booking.list.columns.status")}
          </label>
          <select
            id="booking-filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value === "" ? "" : (e.target.value as BookingStatus))}
            className={selectClass}
          >
            <option value="" />
            <option value="confirmed">{t("user.detail.status.confirmed")}</option>
            <option value="pending">{t("booking.list.status.pending")}</option>
            <option value="cancelled">{t("user.detail.status.cancelled")}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="booking-filter-from" className="text-xs font-medium text-slate-500">
            {t("booking.list.filter.dateFrom")}
          </label>
          <LocaleDatePicker
            id="booking-filter-from"
            value={dateFrom}
            onChange={setDateFrom}
            className={datePickerClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="booking-filter-to" className="text-xs font-medium text-slate-500">
            {t("booking.list.filter.dateTo")}
          </label>
          <LocaleDatePicker id="booking-filter-to" value={dateTo} onChange={setDateTo} className={datePickerClass} />
        </div>
      </div>
    </div>
  );

  const tableHead = (
    <thead className="bg-slate-50 border-b border-slate-200">
      <tr>
        <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("booking.list.columns.client")}</th>
        <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("booking.list.columns.service")}</th>
        <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("booking.list.columns.date")}</th>
        <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("booking.list.columns.amount")}</th>
        <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("booking.list.columns.payment")}</th>
        <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("booking.list.columns.status")}</th>
      </tr>
    </thead>
  );

  const tableBodyRows = listQuery.isLoading ? (
    <tr>
      <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
        {t("booking.list.loading")}
      </td>
    </tr>
  ) : listQuery.isError ? (
    <tr>
      <td colSpan={6} className="px-6 py-10 text-center text-sm text-red-600">
        {t("booking.list.loadError")}
      </td>
    </tr>
  ) : (
    filteredBookings.map((booking) => {
      const tm = bookingLocalTimeHm(booking.startsAt);
      const pay = paymentKindFromAmounts(booking.paidAmount, booking.price);
      return (
        <tr
          key={booking.id}
          onClick={() => router.push(`/admin/bookings/${booking.id}`)}
          className="hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <td className="px-6 py-4 font-medium text-slate-900">{booking.clientName}</td>
          <td className="px-6 py-4 text-slate-700">{booking.serviceName}</td>
          <td className="px-6 py-4 text-slate-700">
            <div className="font-medium text-slate-900">{formatShortDate(booking.startsAt, locale)}</div>
            <div className="text-sm text-slate-500">{tm}</div>
          </td>
          <td className="px-6 py-4 font-medium text-slate-900">€{booking.price}</td>
          <td className="px-6 py-4">
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getPaymentBadgeClass(pay)}`}>
              {getPaymentLabel(pay)}
            </span>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-2">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                {getStatusLabel(booking.status)}
              </span>
              {canQuickValidateFromList(booking) ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleValidateBooking(booking.id);
                  }}
                  className="h-7 px-2.5 text-xs"
                >
                  {t("booking.list.validate")}
                </Button>
              ) : null}
            </div>
          </td>
        </tr>
      );
    })
  );

  const showEmptyList = !listQuery.isLoading && !listQuery.isError && bookingRows.length === 0;
  const showEmptyFiltered =
    !listQuery.isLoading && !listQuery.isError && bookingRows.length > 0 && filteredBookings.length === 0;

  const emptyListBlock = showEmptyList ? (
    <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-16 text-center">
      <NotebookText className="mx-auto size-12 text-slate-300" aria-hidden />
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{t("booking.list.empty.title")}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">{t("booking.list.empty.description")}</p>
      <Button type="button" onClick={() => router.push("/admin/bookings/new")} className="mt-6 h-11 rounded-xl px-6">
        <Plus className="size-5" />
        {t("booking.list.empty.cta")}
      </Button>
    </div>
  ) : null;

  const emptyFilteredBlock = showEmptyFiltered ? (
    <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-14 text-center">
      <Search className="mx-auto size-11 text-slate-300" aria-hidden />
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{t("booking.list.emptyFiltered.title")}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">{t("booking.list.emptyFiltered.description")}</p>
      <Button
        type="button"
        variant="outline"
        onClick={clearFilters}
        disabled={!hasActiveFilters}
        className="mt-6 h-11 rounded-xl border-slate-200"
      >
        <FilterX className="size-4" />
        {t("booking.list.emptyFiltered.clear")}
      </Button>
    </div>
  ) : null;

  const bookingsTable = (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        {tableHead}
        <tbody className="divide-y divide-slate-200">{tableBodyRows}</tbody>
      </table>
      {emptyListBlock}
      {emptyFilteredBlock}
    </div>
  );

  const pageHeader = (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("booking.list.title")}</h1>
        <p className="text-slate-600">{t("booking.list.subtitle")}</p>
      </div>
      <Button type="button" onClick={() => router.push("/admin/bookings/new")} className="h-11 px-6 rounded-xl">
        <Plus className="w-5 h-5" />
        {t("booking.list.new")}
      </Button>
    </div>
  );

  return (
    <div className="p-8">
      {pageHeader}
      {filtersPanel}
      {bookingsTable}
    </div>
  );
}
