"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Euro, ShoppingCart, ArrowUp, ArrowDown, Calendar } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TooltipProps } from "recharts";
import { useLocale, useTranslations } from "next-intl";

type Period = "weekly" | "monthly" | "yearly" | "custom";

type RevenueRow = { periodId: string; revenue: number };
type SalesRow = { periodId: string; sales: number };

type ChartTooltipFormatter = NonNullable<TooltipProps["formatter"]>;

const revenueDataByPeriod: Record<Period, RevenueRow[]> = {
  weekly: [
    { periodId: "weekday_mon", revenue: 420 },
    { periodId: "weekday_tue", revenue: 580 },
    { periodId: "weekday_wed", revenue: 390 },
    { periodId: "weekday_thu", revenue: 650 },
    { periodId: "weekday_fri", revenue: 480 },
    { periodId: "weekday_sat", revenue: 720 },
    { periodId: "weekday_sun", revenue: 550 },
  ],
  monthly: [
    { periodId: "month_jan", revenue: 1200 },
    { periodId: "month_feb", revenue: 1800 },
    { periodId: "month_mar", revenue: 1600 },
    { periodId: "month_apr", revenue: 2400 },
    { periodId: "month_may", revenue: 2180 },
    { periodId: "month_jun", revenue: 2800 },
  ],
  yearly: [
    { periodId: "year_2020", revenue: 12000 },
    { periodId: "year_2021", revenue: 18000 },
    { periodId: "year_2022", revenue: 22000 },
    { periodId: "year_2023", revenue: 28000 },
    { periodId: "year_2024", revenue: 32000 },
    { periodId: "year_2025", revenue: 38000 },
  ],
  custom: [
    { periodId: "custom_s1", revenue: 1200 },
    { periodId: "custom_s2", revenue: 1800 },
    { periodId: "custom_s3", revenue: 1600 },
    { periodId: "custom_s4", revenue: 2400 },
  ],
};

const salesDataByPeriod: Record<Period, SalesRow[]> = {
  weekly: [
    { periodId: "weekday_mon", sales: 3 },
    { periodId: "weekday_tue", sales: 5 },
    { periodId: "weekday_wed", sales: 2 },
    { periodId: "weekday_thu", sales: 7 },
    { periodId: "weekday_fri", sales: 4 },
    { periodId: "weekday_sat", sales: 8 },
    { periodId: "weekday_sun", sales: 6 },
  ],
  monthly: [
    { periodId: "month_sales_s1", sales: 12 },
    { periodId: "month_sales_s2", sales: 19 },
    { periodId: "month_sales_s3", sales: 15 },
    { periodId: "month_sales_s4", sales: 22 },
  ],
  yearly: [
    { periodId: "quarter_q1", sales: 120 },
    { periodId: "quarter_q2", sales: 180 },
    { periodId: "quarter_q3", sales: 150 },
    { periodId: "quarter_q4", sales: 220 },
  ],
  custom: [
    { periodId: "custom_s1", sales: 12 },
    { periodId: "custom_s2", sales: 19 },
    { periodId: "custom_s3", sales: 15 },
    { periodId: "custom_s4", sales: 22 },
  ],
};

function chartAxisPeriodLabel(t: ReturnType<typeof useTranslations>, periodId: string) {
  if (periodId.startsWith("weekday_")) {
    const key = periodId.replace("weekday_", "");
    return t(`dashboard.chart.axis.weekday.${key}`);
  }
  if (periodId.startsWith("month_") && !periodId.startsWith("month_sales_")) {
    const key = periodId.replace("month_", "");
    return t(`dashboard.chart.axis.month.${key}`);
  }
  if (periodId.startsWith("month_sales_")) {
    const key = periodId.replace("month_sales_", "");
    return t(`dashboard.chart.axis.custom.${key}`);
  }
  if (periodId.startsWith("year_")) {
    const year = periodId.replace("year_", "");
    return t(`dashboard.chart.axis.year.y${year}`);
  }
  if (periodId.startsWith("quarter_")) {
    const key = periodId.replace("quarter_", "");
    return t(`dashboard.chart.axis.quarter.${key}`);
  }
  if (periodId.startsWith("custom_")) {
    const key = periodId.replace("custom_", "");
    return t(`dashboard.chart.axis.custom.${key}`);
  }
  return periodId;
}

export default function Dashboard() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("monthly");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  const salesCountFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const formatRevenueTooltipValue = (value: number) => currencyFormatter.format(value);
  const formatSalesTooltipValue = (value: number) => salesCountFormatter.format(value);

  const revenueChartTooltipFormatter: ChartTooltipFormatter = (value) => {
    const raw = Array.isArray(value) ? value[0] : value;
    const numeric = typeof raw === "number" ? raw : Number(raw);
    const safe = Number.isFinite(numeric) ? numeric : 0;
    return [formatRevenueTooltipValue(safe), t("dashboard.chart.series.revenue")];
  };

  const salesChartTooltipFormatter: ChartTooltipFormatter = (value) => {
    const raw = Array.isArray(value) ? value[0] : value;
    const numeric = typeof raw === "number" ? raw : Number(raw);
    const safe = Number.isFinite(numeric) ? numeric : 0;
    return [formatSalesTooltipValue(safe), t("dashboard.chart.series.sales")];
  };

  const chartTooltipLabelFormatter = (label: ReactNode) => {
    if (typeof label === "string") return chartAxisPeriodLabel(t, label);
    if (typeof label === "number") return chartAxisPeriodLabel(t, String(label));
    return label;
  };

  const recentBookings = [
    { id: 1, client: "Marie Dupont", service: "Coaching Personnel 1-on-1", amount: 50, time: "2 heures" },
    { id: 2, client: "Pierre Martin", service: "Coaching Nutrition", amount: 40, time: "5 heures" },
    { id: 3, client: "Sophie Bernard", service: "Pack 5 Sessions", amount: 200, time: "1 jour" },
  ];

  const headerBlock = (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("dashboard.title")}</h1>
      <p className="text-slate-600">{t("dashboard.welcome")}</p>
    </div>
  );

  const kpiCards = (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <button
        type="button"
        onClick={() => router.push("/admin/revenue")}
        className="bg-white rounded-2xl p-6 border border-slate-200 text-left hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Euro className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <ArrowUp className="w-4 h-4" />
            12%
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">€2,800</div>
        <div className="text-slate-600">{t("dashboard.revenue.total")}</div>
        <div className="text-sm text-green-600 mt-2">+€680 {t("dashboard.growth.month")}</div>
      </button>

      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-50 rounded-xl">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <ArrowUp className="w-4 h-4" />
            15%
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">142</div>
        <div className="text-slate-600">{t("dashboard.total.users")}</div>
        <div className="text-sm text-green-600 mt-2">+12 {t("dashboard.users.month")}</div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-orange-50 rounded-xl">
            <ShoppingCart className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex items-center gap-1 text-red-600 text-sm">
            <ArrowDown className="w-4 h-4" />
            3%
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">68</div>
        <div className="text-slate-600">{t("dashboard.sales.month")}</div>
      </div>
    </div>
  );

  const periodSelector = (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-5 h-5 text-slate-600" />
        <div className="flex gap-2">
          {(["weekly", "monthly", "yearly", "custom"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                period === p ? "bg-blue-600 text-white" : "bg-white text-slate-700 border border-slate-200 hover:border-blue-300"
              }`}
            >
              {t(`dashboard.period.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {period === "custom" && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <label htmlFor="custom-start" className="text-sm font-medium text-slate-700">
              {t("dashboard.period.from")}
            </label>
            <input
              id="custom-start"
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="custom-end" className="text-sm font-medium text-slate-700">
              {t("dashboard.period.to")}
            </label>
            <input
              id="custom-end"
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      )}
    </div>
  );

  const revenueChart = (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-6">{t("dashboard.revenue.overview")}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={revenueDataByPeriod[period]}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="periodId" stroke="#64748b" tickFormatter={(id) => chartAxisPeriodLabel(t, id)} />
          <YAxis stroke="#64748b" tickFormatter={(v) => currencyFormatter.format(Number(v))} />
          <Tooltip
            formatter={revenueChartTooltipFormatter}
            labelFormatter={chartTooltipLabelFormatter}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          />
          <Line type="monotone" dataKey="revenue" name={t("dashboard.chart.series.revenue")} stroke="#2563eb" strokeWidth={3} dot={{ fill: "#2563eb", r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const salesChart = (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-6">{t("dashboard.weekly.sales")}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={salesDataByPeriod[period]}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="periodId" stroke="#64748b" tickFormatter={(id) => chartAxisPeriodLabel(t, id)} />
          <YAxis stroke="#64748b" />
          <Tooltip
            formatter={salesChartTooltipFormatter}
            labelFormatter={chartTooltipLabelFormatter}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="sales" name={t("dashboard.chart.series.sales")} fill="#2563eb" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const chartsGrid = (
    <div className="grid lg:grid-cols-2 gap-6 mb-8">
      {revenueChart}
      {salesChart}
    </div>
  );

  const recentActivity = (
    <div className="bg-white rounded-2xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">{t("dashboard.recent.bookings")}</h2>
      </div>
      <div className="divide-y divide-slate-200">
        {recentBookings.map((booking) => (
          <div
            key={booking.id}
            onClick={() => router.push(`/admin/bookings/${booking.id}`)}
            className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">{booking.client}</h3>
                <p className="text-sm text-slate-600">{booking.service}</p>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-600">€{booking.amount}</div>
                <div className="text-sm text-slate-500">il y a {booking.time}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-8">
      {headerBlock}
      {kpiCards}
      {periodSelector}
      {chartsGrid}
      {recentActivity}
    </div>
  );
}
