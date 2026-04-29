"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "@web/libs/auth-client";
import { trpc } from "@web/libs/trpc-client";
import { cn } from "@repo/ui/utils/cn";

function formatTrendPercent(pct: number | null): string | null {
  if (pct === null || Number.isNaN(pct)) return null;
  const rounded = Math.round(pct * 10) / 10;
  const s = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${rounded > 0 ? "+" : ""}${s}%`;
}

function monthLabelUtc(locale: string, year: number, month: number): string {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

export default function RevenueHistoryView() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { data: sessionPayload, isPending: sessionPending } = useSession();
  const sessionReady = !sessionPending && Boolean(sessionPayload?.user);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const monthsQuery = trpc.dashboard.revenueMonths.useQuery(
    { limitMonths: 24 },
    { enabled: sessionReady, staleTime: 30_000 },
  );

  const loadingBlock = monthsQuery.isPending ? (
    <div className="flex items-center gap-2 text-slate-600 py-12 justify-center">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>{t("dashboard.revenueHistory.loading")}</span>
    </div>
  ) : null;

  const errorBlock = monthsQuery.isError ? (
    <p className="text-red-600 py-8 text-center">{t("dashboard.revenueHistory.loadError")}</p>
  ) : null;

  const headerRow = (
    <tr>
      <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("dashboard.revenueHistory.columns.month")}</th>
      <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("dashboard.revenueHistory.columns.revenue")}</th>
      <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("dashboard.revenueHistory.columns.bookings")}</th>
    </tr>
  );

  const monthRows =
    monthsQuery.data?.map((row) => {
      const growthLabel = formatTrendPercent(row.growthPercent);
      const label = monthLabelUtc(locale, row.year, row.month);
      const key = `${row.year}-${row.month}`;
      const dateFrom = `${row.year}-${String(row.month).padStart(2, "0")}-01`;
      const monthEnd = new Date(Date.UTC(row.year, row.month, 0));
      const dateTo = `${row.year}-${String(row.month).padStart(2, "0")}-${String(monthEnd.getUTCDate()).padStart(2, "0")}`;

      return (
        <tr
          key={key}
          role="button"
          tabIndex={0}
          className="hover:bg-slate-50 transition-colors cursor-pointer"
          onClick={() => {
            router.push(`/admin/bookings?dateFrom=${dateFrom}&dateTo=${dateTo}`);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push(`/admin/bookings?dateFrom=${dateFrom}&dateTo=${dateTo}`);
            }
          }}
        >
          <td className="px-6 py-4 font-medium text-slate-900">{label}</td>
          <td className="px-6 py-4 font-semibold text-blue-600">{currencyFormatter.format(row.revenue)}</td>
          <td className="px-6 py-4 text-slate-700">{row.bookingsCount}</td>
        </tr>
      );
    }) ?? [];

  const mainTable = !monthsQuery.isPending && !monthsQuery.isError ? (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="bg-slate-50 border-b border-slate-200">{headerRow}</thead>
          <tbody className="divide-y divide-slate-200">
            {monthRows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-slate-600">
                  {t("dashboard.revenueHistory.empty")}
                </td>
              </tr>
            ) : (
              monthRows
            )}
          </tbody>
        </table>
      </div>
    </div>
  ) : null;

  const pageIntro = (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("dashboard.revenueHistory.title")}</h1>
      <p className="text-slate-600">{t("dashboard.revenueHistory.subtitle")}</p>
      <p className="text-sm text-slate-500 mt-2">{t("dashboard.revenueHistory.clickHint")}</p>
    </div>
  );

  return (
    <div className="p-8">
      {pageIntro}
      {loadingBlock}
      {errorBlock}
      {mainTable}
    </div>
  );
}
