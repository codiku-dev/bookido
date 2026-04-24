"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Euro, ShoppingCart, ArrowUp, ArrowDown, Calendar, Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TooltipProps } from "recharts";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "@web/libs/auth-client";
import { trpc } from "@web/libs/trpc-client";
import { formatRelativeTimeLabel } from "#/utils/relative-time-label";

type Period = "weekly" | "monthly" | "yearly" | "custom";

type ChartTooltipFormatter = NonNullable<TooltipProps["formatter"]>;

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
    return periodId.replace("year_", "");
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

function formatSignedCurrency(value: number, fmt: Intl.NumberFormat): string {
  if (value > 0) return `+${fmt.format(value)}`;
  if (value < 0) return `-${fmt.format(Math.abs(value))}`;
  return fmt.format(0);
}

function formatTrendPercent(pct: number | null): string | null {
  if (pct === null || Number.isNaN(pct)) return null;
  const rounded = Math.round(pct * 10) / 10;
  const s = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${rounded > 0 ? "+" : ""}${s}%`;
}

export default function Dashboard() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { data: sessionPayload, isPending: sessionPending } = useSession();
  const [period, setPeriod] = useState<Period>("monthly");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const sessionReady = !sessionPending && Boolean(sessionPayload?.user);

  const chartsOverviewInput = useMemo(() => {
    if (period === "custom" && customStartDate && customEndDate) {
      return { chartPeriod: period, customFrom: customStartDate, customTo: customEndDate };
    }
    return { chartPeriod: period };
  }, [period, customStartDate, customEndDate]);

  const kpisQuery = trpc.dashboard.overview.useQuery(
    { chartPeriod: "monthly" },
    {
      enabled: sessionReady,
      retry: false,
    },
  );

  const chartsQuery = trpc.dashboard.overview.useQuery(chartsOverviewInput, {
    enabled: sessionReady && (period !== "custom" || (Boolean(customStartDate) && Boolean(customEndDate))),
    retry: false,
  });

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

  const kpis = kpisQuery.data?.kpis;
  const revenueLineData = useMemo(
    () => chartsQuery.data?.revenueSeries.map((r) => ({ periodId: r.periodKey, revenue: r.revenue })) ?? [],
    [chartsQuery.data],
  );
  const salesBarData = useMemo(
    () => chartsQuery.data?.salesSeries.map((r) => ({ periodId: r.periodKey, sales: r.sales })) ?? [],
    [chartsQuery.data],
  );
  const recentBookings = kpisQuery.data?.recentBookings ?? [];

  const greetingName = sessionPayload?.user?.name?.trim() ?? "";
  const showGreeting = !sessionPending && greetingName.length > 0;

  const greetingLine = showGreeting ? (
    <p className="text-base font-medium text-slate-800 mb-2">{t("dashboard.greeting", { name: greetingName })}</p>
  ) : null;

  const headerBlock = (
    <div className="mb-8">
      {greetingLine}
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("dashboard.title")}</h1>
      <p className="text-slate-600">{t("dashboard.welcome")}</p>
    </div>
  );

  const revenueTrendLabel = formatTrendPercent(kpis?.revenueTrendPercent ?? null);
  const clientsTrendLabel = formatTrendPercent(kpis?.clientsTrendPercent ?? null);
  const bookingsTrendLabel = formatTrendPercent(kpis?.bookingsTrendPercent ?? null);

  const revenueTrendBadge =
    revenueTrendLabel === null ? null : (
      <div
        className={`flex items-center gap-1 text-sm ${
          (kpis?.revenueTrendPercent ?? 0) >= 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        {(kpis?.revenueTrendPercent ?? 0) >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
        {revenueTrendLabel}
      </div>
    );

  const clientsTrendBadge =
    clientsTrendLabel === null ? null : (
      <div
        className={`flex items-center gap-1 text-sm ${
          (kpis?.clientsTrendPercent ?? 0) >= 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        {(kpis?.clientsTrendPercent ?? 0) >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
        {clientsTrendLabel}
      </div>
    );

  const bookingsTrendBadge =
    bookingsTrendLabel === null ? null : (
      <div
        className={`flex items-center gap-1 text-sm ${
          (kpis?.bookingsTrendPercent ?? 0) >= 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        {(kpis?.bookingsTrendPercent ?? 0) >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
        {bookingsTrendLabel}
      </div>
    );

  const kpiLoading = kpisQuery.isPending ? (
    <div className="flex items-center justify-center py-12 text-slate-500 gap-2">
      <Loader2 className="w-5 h-5 animate-spin" />
      {t("dashboard.loading")}
    </div>
  ) : null;

  const kpiError = kpisQuery.isError ? (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-6">{t("dashboard.loadError")}</div>
  ) : null;

  const kpiCards = kpisQuery.data && !kpisQuery.isError ? (
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
          {revenueTrendBadge}
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">{currencyFormatter.format(kpis?.totalRevenue ?? 0)}</div>
        <div className="text-slate-600">{t("dashboard.revenue.total")}</div>
        <div
          className={`text-sm mt-2 ${(kpis?.revenueThisMonth ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}
        >
          {formatSignedCurrency(kpis?.revenueThisMonth ?? 0, currencyFormatter)} {t("dashboard.growth.month")}
        </div>
      </button>

      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-50 rounded-xl">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          {clientsTrendBadge}
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">{salesCountFormatter.format(kpis?.clientsTotal ?? 0)}</div>
        <div className="text-slate-600">{t("dashboard.total.users")}</div>
        <div className="text-sm text-green-600 mt-2">
          +{salesCountFormatter.format(kpis?.clientsNewThisMonth ?? 0)} {t("dashboard.users.month")}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-orange-50 rounded-xl">
            <ShoppingCart className="w-6 h-6 text-orange-600" />
          </div>
          {bookingsTrendBadge}
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">{salesCountFormatter.format(kpis?.bookingsThisMonth ?? 0)}</div>
        <div className="text-slate-600">{t("dashboard.sales.month")}</div>
      </div>
    </div>
  ) : null;

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

  const chartsReady = Boolean(chartsQuery.data) && !chartsQuery.isError;

  const revenueChart = (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-6">{t("dashboard.revenue.overview")}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={revenueLineData}>
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
        <BarChart data={salesBarData}>
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

  const recentEmpty = recentBookings.length === 0 && chartsReady ? (
    <p className="px-6 py-8 text-center text-slate-500 text-sm">{t("dashboard.recent.empty")}</p>
  ) : null;

  const recentRows =
    recentBookings.length > 0
      ? recentBookings.map((booking) => {
          const createdAt = new Date(booking.createdAt);
          const relativeLabel = formatRelativeTimeLabel(locale, createdAt);
          const row = (
            <div
              key={booking.id}
              onClick={() => router.push(`/admin/bookings/${booking.id}`)}
              className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{booking.clientName}</h3>
                  <p className="text-sm text-slate-600">{booking.serviceName}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{currencyFormatter.format(booking.amount)}</div>
                  <div className="text-sm text-slate-500">{relativeLabel}</div>
                </div>
              </div>
            </div>
          );
          return row;
        })
      : null;

  const recentActivity = (
    <div className="bg-white rounded-2xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">{t("dashboard.recent.bookings")}</h2>
      </div>
      <div className="divide-y divide-slate-200">
        {kpisQuery.isPending ? (
          <div className="flex items-center justify-center py-10 text-slate-500 gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("dashboard.loading")}
          </div>
        ) : null}
        {recentEmpty}
        {recentRows}
      </div>
    </div>
  );

  return (
    <div className="p-8">
      {headerBlock}
      {kpiError}
      {kpiLoading}
      {kpiCards}
      {periodSelector}
      {chartsGrid}
      {recentActivity}
    </div>
  );
}
