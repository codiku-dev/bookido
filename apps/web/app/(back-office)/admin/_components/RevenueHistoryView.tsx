"use client";

import { useTranslations } from "next-intl";

type RevenueRow = {
  month: string;
  revenue: number;
  growth: string;
  bookings: number;
};

const revenueHistory: RevenueRow[] = [
  { month: "Jan 2026", revenue: 1200, growth: "+8%", bookings: 28 },
  { month: "Feb 2026", revenue: 1800, growth: "+12%", bookings: 36 },
  { month: "Mar 2026", revenue: 1600, growth: "-4%", bookings: 31 },
  { month: "Apr 2026", revenue: 2400, growth: "+15%", bookings: 44 },
  { month: "May 2026", revenue: 2180, growth: "-9%", bookings: 40 },
  { month: "Jun 2026", revenue: 2800, growth: "+28%", bookings: 52 },
];

export default function RevenueHistoryView() {
  const t = useTranslations();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("dashboard.revenueHistory.title")}</h1>
        <p className="text-slate-600">{t("dashboard.revenueHistory.subtitle")}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("dashboard.revenueHistory.columns.month")}</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("dashboard.revenueHistory.columns.revenue")}</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("dashboard.revenueHistory.columns.growth")}</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("dashboard.revenueHistory.columns.bookings")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {revenueHistory.map((row) => (
              <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{row.month}</td>
                <td className="px-6 py-4 font-semibold text-blue-600">€{row.revenue}</td>
                <td className={`px-6 py-4 font-medium ${row.growth.startsWith("+") ? "text-green-600" : "text-red-600"}`}>{row.growth}</td>
                <td className="px-6 py-4 text-slate-700">{row.bookings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
