"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

type BookingStatus = "confirmed" | "pending" | "cancelled";

type BookingRow = {
  id: number;
  client: string;
  service: string;
  date: string;
  time: string;
  amount: number;
  status: BookingStatus;
};

const bookings: BookingRow[] = [
  { id: 1, client: "Marie Dupont", service: "Coaching Personnel 1-on-1", date: "2026-04-14", time: "09:00", amount: 50, status: "confirmed" },
  { id: 2, client: "Pierre Martin", service: "Coaching Nutrition", date: "2026-04-14", time: "14:00", amount: 40, status: "confirmed" },
  { id: 3, client: "Sophie Bernard", service: "Pack 5 Sessions", date: "2026-04-15", time: "10:00", amount: 200, status: "pending" },
  { id: 4, client: "Lucas Petit", service: "Monthly Training Plan", date: "2026-04-16", time: "15:00", amount: 180, status: "cancelled" },
];

export default function BookingsView() {
  const t = useTranslations();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredBookings = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) {
      return bookings;
    }
    return bookings.filter((booking) =>
      [booking.client, booking.service, booking.date, booking.time].some((value) => value.toLowerCase().includes(query)),
    );
  }, [search]);

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("booking.list.title")}</h1>
        <p className="text-slate-600">{t("booking.list.subtitle")}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("booking.list.search")}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("booking.list.columns.client")}</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("booking.list.columns.service")}</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("booking.list.columns.date")}</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("booking.list.columns.time")}</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("booking.list.columns.amount")}</th>
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
                <td className="px-6 py-4 text-slate-700">{booking.date}</td>
                <td className="px-6 py-4 text-slate-700">{booking.time}</td>
                <td className="px-6 py-4 font-medium text-slate-900">€{booking.amount}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
