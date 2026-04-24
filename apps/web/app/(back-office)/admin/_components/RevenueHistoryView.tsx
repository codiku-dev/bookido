"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "@web/libs/auth-client";
import { trpc } from "@web/libs/trpc-client";
import { Button } from "#/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "#/components/ui/sheet";
import { cn } from "@repo/ui/utils/cn";

type SelectedMonth = { year: number; month: number };

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
  const { data: sessionPayload, isPending: sessionPending } = useSession();
  const sessionReady = !sessionPending && Boolean(sessionPayload?.user);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedMonth | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }),
    [locale],
  );

  const monthsQuery = trpc.dashboard.revenueMonths.useQuery(
    { limitMonths: 24 },
    { enabled: sessionReady, staleTime: 30_000 },
  );

  const detailQuery = trpc.dashboard.revenueMonthBookings.useQuery(
    selected ?? { year: 1970, month: 1 },
    { enabled: sessionReady && sheetOpen && selected !== null, staleTime: 15_000 },
  );

  const openMonth = (slot: SelectedMonth) => {
    setSelected(slot);
    setSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSelected(null);
    }
  };

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
      <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("dashboard.revenueHistory.columns.growth")}</th>
      <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("dashboard.revenueHistory.columns.bookings")}</th>
    </tr>
  );

  const monthRows =
    monthsQuery.data?.map((row) => {
      const growthLabel = formatTrendPercent(row.growthPercent);
      const label = monthLabelUtc(locale, row.year, row.month);
      const key = `${row.year}-${row.month}`;

      return (
        <tr
          key={key}
          role="button"
          tabIndex={0}
          className="hover:bg-slate-50 transition-colors cursor-pointer"
          onClick={() => openMonth({ year: row.year, month: row.month })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openMonth({ year: row.year, month: row.month });
            }
          }}
        >
          <td className="px-6 py-4 font-medium text-slate-900">{label}</td>
          <td className="px-6 py-4 font-semibold text-blue-600">{currencyFormatter.format(row.revenue)}</td>
          <td
            className={cn(
              "px-6 py-4 font-medium",
              growthLabel === null ? "text-slate-500" : row.growthPercent !== null && row.growthPercent >= 0 ? "text-green-600" : "text-red-600",
            )}
          >
            {growthLabel ?? "—"}
          </td>
          <td className="px-6 py-4 text-slate-700">{row.bookingsCount}</td>
        </tr>
      );
    }) ?? [];

  const mainTable = !monthsQuery.isPending && !monthsQuery.isError ? (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">{headerRow}</thead>
        <tbody className="divide-y divide-slate-200">
          {monthRows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-slate-600">
                {t("dashboard.revenueHistory.empty")}
              </td>
            </tr>
          ) : (
            monthRows
          )}
        </tbody>
      </table>
    </div>
  ) : null;

  const sheetTitle =
    selected !== null ? t("dashboard.revenueHistory.sheetTitle", { month: monthLabelUtc(locale, selected.year, selected.month) }) : "";

  const detailHeaderRow = (
    <tr>
      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">{t("dashboard.revenueHistory.detailColumns.date")}</th>
      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">{t("dashboard.revenueHistory.detailColumns.client")}</th>
      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">{t("dashboard.revenueHistory.detailColumns.service")}</th>
      <th className="px-3 py-2 text-right text-xs font-medium text-slate-600">{t("dashboard.revenueHistory.detailColumns.price")}</th>
      <th className="px-3 py-2 text-right text-xs font-medium text-slate-600">{t("dashboard.revenueHistory.detailColumns.paid")}</th>
      <th className="px-3 py-2 text-right text-xs font-medium text-slate-600">{t("dashboard.revenueHistory.detailColumns.amount")}</th>
      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">{t("dashboard.revenueHistory.detailColumns.status")}</th>
      <th className="px-3 py-2 text-right text-xs font-medium text-slate-600" />
    </tr>
  );

  const detailRows = detailQuery.data ?? [];

  const detailBody = detailQuery.isPending ? (
    <tr>
      <td colSpan={8} className="px-3 py-8 text-center text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin inline mr-2 align-middle" />
      </td>
    </tr>
  ) : detailRows.length === 0 ? (
    <tr>
      <td colSpan={8} className="px-3 py-8 text-center text-slate-600">
        {t("dashboard.revenueHistory.detailEmpty")}
      </td>
    </tr>
  ) : (
    detailRows.map((b) => (
      <tr key={b.id} className={cn("border-t border-slate-100", b.status === "cancelled" && "opacity-70")}>
        <td className="px-3 py-2 text-sm text-slate-800 whitespace-nowrap">{dateTimeFormatter.format(new Date(b.startsAt))}</td>
        <td className="px-3 py-2 text-sm text-slate-800">{b.clientName}</td>
        <td className="px-3 py-2 text-sm text-slate-700">{b.serviceName}</td>
        <td className="px-3 py-2 text-sm text-right tabular-nums">{currencyFormatter.format(b.price)}</td>
        <td className="px-3 py-2 text-sm text-right tabular-nums">{currencyFormatter.format(b.paidAmount)}</td>
        <td className="px-3 py-2 text-sm text-right font-medium tabular-nums">{currencyFormatter.format(b.amount)}</td>
        <td className="px-3 py-2 text-sm text-slate-700">{t(`dashboard.revenueHistory.status.${b.status}`)}</td>
        <td className="px-3 py-2 text-right">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/bookings/${b.id}`}>{t("dashboard.revenueHistory.openBooking")}</Link>
          </Button>
        </td>
      </tr>
    ))
  );

  const detailTable = (
    <div className="mt-4 overflow-auto max-h-[min(70vh,520px)] rounded-lg border border-slate-200">
      <table className="w-full min-w-[720px]">
        <thead className="bg-slate-50 sticky top-0">{detailHeaderRow}</thead>
        <tbody>{detailBody}</tbody>
      </table>
    </div>
  );

  const detailSheet = (
    <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent side="right" className="w-full px-4 sm:max-w-2xl sm:px-6 overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle>{sheetTitle}</SheetTitle>
        </SheetHeader>
        {detailTable}
      </SheetContent>
    </Sheet>
  );

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
      {detailSheet}
    </div>
  );
}
