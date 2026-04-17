"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { LocaleDatePicker } from "#/components/LocaleDatePicker";
import { Button } from "#/components/ui/button";
import { useLanguage } from "#/components/use-language";
import { formatShortDate } from "#/utils/dateFormat";

type BookingStatus = "confirmed" | "pending" | "cancelled";
type PaymentStatus = "paid" | "unpaid";

type BookingRow = {
  id: number;
  client: string;
  service: string;
  date: string;
  time: string;
  amount: number;
  payment: PaymentStatus;
  status: BookingStatus;
};

const bookings: BookingRow[] = [
  { id: 1, client: "Marie Dupont", service: "Coaching Personnel 1-on-1", date: "2026-04-14", time: "09:00", amount: 50, payment: "paid", status: "confirmed" },
  { id: 2, client: "Pierre Martin", service: "Coaching Nutrition", date: "2026-04-14", time: "14:00", amount: 40, payment: "paid", status: "confirmed" },
  { id: 3, client: "Sophie Bernard", service: "Pack 5 Sessions", date: "2026-04-15", time: "10:00", amount: 200, payment: "unpaid", status: "pending" },
  { id: 4, client: "Lucas Petit", service: "Monthly Training Plan", date: "2026-04-16", time: "15:00", amount: 180, payment: "unpaid", status: "cancelled" },
];

export default function BookingsView() {
  const t = useTranslations();
  const router = useRouter();
  const { locale } = useLanguage();
  const [bookingRows, setBookingRows] = useState<BookingRow[]>(bookings);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"" | PaymentStatus>("");
  const [statusFilter, setStatusFilter] = useState<"" | BookingStatus>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

  const getPaymentBadgeClass = (payment: PaymentStatus) => {
    if (payment === "paid") return "bg-emerald-50 text-emerald-700";
    return "bg-slate-100 text-slate-600";
  };

  const getPaymentLabel = (payment: PaymentStatus) =>
    payment === "paid" ? t("booking.list.payment.paid") : t("booking.list.payment.unpaid");

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookingRows.filter((b) => {
      if (q.length > 0) {
        const matchesSearch =
          b.client.toLowerCase().includes(q) || b.service.toLowerCase().includes(q) || b.amount.toString().includes(q);
        if (!matchesSearch) return false;
      }
      if (paymentFilter && b.payment !== paymentFilter) return false;
      if (statusFilter && b.status !== statusFilter) return false;
      if (dateFrom && b.date < dateFrom) return false;
      if (dateTo && b.date > dateTo) return false;
      return true;
    });
  }, [bookingRows, search, paymentFilter, statusFilter, dateFrom, dateTo]);

  const handleValidateBooking = (bookingId: number) => {
    setBookingRows((currentRows) =>
      currentRows.map((booking) =>
        booking.id === bookingId ? { ...booking, status: "confirmed", payment: "paid" } : booking,
      ),
    );
  };

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
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
            onChange={(e) => setPaymentFilter(e.target.value === "" ? "" : (e.target.value as PaymentStatus))}
            className={selectClass}
          >
            <option value="" />
            <option value="paid">{t("booking.list.payment.paid")}</option>
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

  const bookingsTable = (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full">
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
        <tbody className="divide-y divide-slate-200">
          {filteredBookings.map((booking) => (
            <tr
              key={booking.id}
              onClick={() => router.push(`/admin/bookings/${booking.id}`)}
              className="hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <td className="px-6 py-4 font-medium text-slate-900">{booking.client}</td>
              <td className="px-6 py-4 text-slate-700">{booking.service}</td>
              <td className="px-6 py-4 text-slate-700">
                <div className="font-medium text-slate-900">{formatShortDate(booking.date, locale)}</div>
                <div className="text-sm text-slate-500">{booking.time}</div>
              </td>
              <td className="px-6 py-4 font-medium text-slate-900">€{booking.amount}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getPaymentBadgeClass(booking.payment)}`}>
                  {getPaymentLabel(booking.payment)}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                  {booking.status === "pending" && (
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
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const pageHeader = (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("booking.list.title")}</h1>
      <p className="text-slate-600">{t("booking.list.subtitle")}</p>
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
