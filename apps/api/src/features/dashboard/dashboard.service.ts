import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@api/generated/prisma/client";

import { PrismaService } from "@api/src/infrastructure/prisma/prisma.service";

import type {
  DashboardOverviewInput,
  DashboardOverviewOutput,
  DashboardRevenueMonthBookingRow,
  DashboardRevenueMonthRow,
} from "./dashboard.schema";

const MONTH_ABBREVS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
const WEEKDAY_SUFFIX = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function addUtcMonthsStart(y: number, m: number, delta: number): Date {
  const d = new Date(Date.UTC(y, m + delta, 1));
  return d;
}

function utcMonthRange(y: number, m: number): { start: Date; endExclusive: Date } {
  const start = new Date(Date.UTC(y, m, 1));
  const endExclusive = new Date(Date.UTC(y, m + 1, 1));
  return { start, endExclusive };
}

function parseDateOnlyUtc(s: string): Date {
  const parts = s.split("-");
  const ys = Number(parts[0]);
  const mo = Number(parts[1]);
  const ds = Number(parts[2]);
  if (!Number.isFinite(ys) || !Number.isFinite(mo) || !Number.isFinite(ds)) {
    throw new BadRequestException("Invalid date");
  }
  return new Date(Date.UTC(ys, mo - 1, ds));
}

function weekdayPeriodKey(d: Date): string {
  const dow = d.getUTCDay();
  const idx = dow === 0 ? 6 : dow - 1;
  return `weekday_${WEEKDAY_SUFFIX[idx]}`;
}

function monthPeriodKey(y: number, m: number): string {
  return `month_${MONTH_ABBREVS[m]}`;
}

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

@Injectable()
export class DashboardService {
  constructor(private readonly db: PrismaService) {}

  private bookingWhereActive(ownerId: string): Prisma.BookingWhereInput {
    return { ownerId, status: { not: "cancelled" } };
  }

  private effectiveBookingAmount(paidAmount: number, price: number): number {
    return paidAmount > 0 ? paidAmount : price;
  }

  private async monthRevenueAndCount(
    ownerId: string,
    start: Date,
    endExclusive: Date,
  ): Promise<{ revenue: number; bookings: number }> {
    const rows = await this.db.booking.findMany({
      where: {
        ...this.bookingWhereActive(ownerId),
        startsAt: { gte: start, lt: endExclusive },
      },
      select: { paidAmount: true, price: true },
    });
    let revenue = 0;
    for (const r of rows) {
      revenue += this.effectiveBookingAmount(r.paidAmount, r.price);
    }
    return { revenue, bookings: rows.length };
  }

  private async sumPaid(ownerId: string, start: Date, endExclusive: Date): Promise<number> {
    const r = await this.db.booking.aggregate({
      where: {
        ...this.bookingWhereActive(ownerId),
        createdAt: { gte: start, lt: endExclusive },
      },
      _sum: { paidAmount: true },
    });
    return r._sum.paidAmount ?? 0;
  }

  private async countBookings(ownerId: string, start: Date, endExclusive: Date): Promise<number> {
    return this.db.booking.count({
      where: {
        ...this.bookingWhereActive(ownerId),
        createdAt: { gte: start, lt: endExclusive },
      },
    });
  }

  private async countNewClients(ownerId: string, start: Date, endExclusive: Date): Promise<number> {
    return this.db.client.count({
      where: { ownerId, createdAt: { gte: start, lt: endExclusive } },
    });
  }

  async overview(ownerId: string, input: DashboardOverviewInput): Promise<DashboardOverviewOutput> {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();

    if (input.chartPeriod === "custom") {
      if (!input.customFrom || !input.customTo) {
        throw new BadRequestException("customFrom and customTo are required for custom period");
      }
      const a = parseDateOnlyUtc(input.customFrom);
      const b = parseDateOnlyUtc(input.customTo);
      if (b.getTime() < a.getTime()) {
        throw new BadRequestException("customTo must be on or after customFrom");
      }
    }

    const { start: thisMonthStart, endExclusive: nextMonthStart } = utcMonthRange(y, m);
    const { start: prevMonthStart, endExclusive: prevMonthEnd } = utcMonthRange(y, m - 1);

    const [totalRevenueAgg, revenueThisMonth, revenuePrevMonth, clientsTotal, clientsNewThisMonth, clientsNewPrevMonth, bookingsThisMonth, bookingsPrevMonth] =
      await Promise.all([
        this.db.booking.aggregate({
          where: this.bookingWhereActive(ownerId),
          _sum: { paidAmount: true },
        }),
        this.sumPaid(ownerId, thisMonthStart, nextMonthStart),
        this.sumPaid(ownerId, prevMonthStart, prevMonthEnd),
        this.db.client.count({ where: { ownerId } }),
        this.countNewClients(ownerId, thisMonthStart, nextMonthStart),
        this.countNewClients(ownerId, prevMonthStart, prevMonthEnd),
        this.countBookings(ownerId, thisMonthStart, nextMonthStart),
        this.countBookings(ownerId, prevMonthStart, prevMonthEnd),
      ]);

    const totalRevenue = totalRevenueAgg._sum.paidAmount ?? 0;

    const revenueSeries: DashboardOverviewOutput["revenueSeries"] = [];
    const salesSeries: DashboardOverviewOutput["salesSeries"] = [];

    if (input.chartPeriod === "weekly") {
      const dow = now.getUTCDay();
      const offsetToMonday = dow === 0 ? -6 : 1 - dow;
      const monday = utcDayStart(addUtcDays(now, offsetToMonday));
      for (let i = 0; i < 7; i++) {
        const day = addUtcDays(monday, i);
        const next = addUtcDays(day, 1);
        const [rev, sales] = await Promise.all([this.sumPaid(ownerId, day, next), this.countBookings(ownerId, day, next)]);
        revenueSeries.push({ periodKey: weekdayPeriodKey(day), revenue: rev });
        salesSeries.push({ periodKey: weekdayPeriodKey(day), sales });
      }
    } else if (input.chartPeriod === "monthly") {
      for (let k = 5; k >= 0; k--) {
        const ref = addUtcMonthsStart(y, m, -k);
        const yy = ref.getUTCFullYear();
        const mm = ref.getUTCMonth();
        const { start, endExclusive } = utcMonthRange(yy, mm);
        const rev = await this.sumPaid(ownerId, start, endExclusive);
        revenueSeries.push({ periodKey: monthPeriodKey(yy, mm), revenue: rev });
      }
      const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      const segments: [number, number][] = [
        [1, 7],
        [8, 14],
        [15, 21],
        [22, dim],
      ];
      let s = 1;
      for (const [fromDay, toDay] of segments) {
        const start = new Date(Date.UTC(y, m, fromDay));
        const endExclusive = new Date(Date.UTC(y, m, toDay + 1));
        const sales = await this.countBookings(ownerId, start, endExclusive);
        salesSeries.push({ periodKey: `month_sales_s${s}`, sales });
        s += 1;
      }
    } else if (input.chartPeriod === "yearly") {
      for (let k = 5; k >= 0; k--) {
        const year = y - k;
        const start = new Date(Date.UTC(year, 0, 1));
        const endExclusive = new Date(Date.UTC(year + 1, 0, 1));
        const rev = await this.sumPaid(ownerId, start, endExclusive);
        revenueSeries.push({ periodKey: `year_${year}`, revenue: rev });
      }
      const quarters: [number, number][] = [
        [0, 3],
        [3, 6],
        [6, 9],
        [9, 12],
      ];
      let qi = 1;
      for (const [sm, em] of quarters) {
        const start = new Date(Date.UTC(y, sm, 1));
        const endExclusive = new Date(Date.UTC(y, em, 1));
        const sales = await this.countBookings(ownerId, start, endExclusive);
        salesSeries.push({ periodKey: `quarter_q${qi}`, sales });
        qi += 1;
      }
    } else {
      const from = parseDateOnlyUtc(input.customFrom!);
      const toInclusive = parseDateOnlyUtc(input.customTo!);
      const rangeStart = utcDayStart(from);
      const rangeEndExclusive = addUtcDays(utcDayStart(toInclusive), 1);
      const spanMs = rangeEndExclusive.getTime() - rangeStart.getTime();
      if (spanMs <= 0) {
        throw new BadRequestException("Invalid custom range");
      }
      for (let i = 0; i < 4; i++) {
        const segStart = new Date(rangeStart.getTime() + (spanMs * i) / 4);
        const segEnd = new Date(rangeStart.getTime() + (spanMs * (i + 1)) / 4);
        const [rev, sales] = await Promise.all([
          this.sumPaid(ownerId, segStart, segEnd),
          this.countBookings(ownerId, segStart, segEnd),
        ]);
        revenueSeries.push({ periodKey: `custom_s${i + 1}`, revenue: rev });
        salesSeries.push({ periodKey: `custom_s${i + 1}`, sales });
      }
    }

    const recentRows = await this.db.booking.findMany({
      where: this.bookingWhereActive(ownerId),
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { client: true, service: true },
    });

    const recentBookings = recentRows.map((row) => ({
      id: row.id,
      clientName: row.client.name,
      serviceName: row.service.name,
      amount: row.paidAmount > 0 ? row.paidAmount : row.price,
      createdAt: row.createdAt,
    }));

    return {
      kpis: {
        totalRevenue,
        revenueThisMonth,
        revenueTrendPercent: pctChange(revenueThisMonth, revenuePrevMonth),
        clientsTotal,
        clientsNewThisMonth,
        clientsTrendPercent: pctChange(clientsNewThisMonth, clientsNewPrevMonth),
        bookingsThisMonth,
        bookingsTrendPercent: pctChange(bookingsThisMonth, bookingsPrevMonth),
      },
      revenueSeries,
      salesSeries,
      recentBookings,
    };
  }

  async revenueMonths(ownerId: string, limitMonths: number): Promise<DashboardRevenueMonthRow[]> {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const owner = await this.db.user.findUnique({
      where: { id: ownerId },
      select: { createdAt: true },
    });
    const ownerCreatedAt = owner?.createdAt ?? now;
    const ownerStartYear = ownerCreatedAt.getUTCFullYear();
    const ownerStartMonth = ownerCreatedAt.getUTCMonth();

    const slots: { year: number; month: number }[] = [];
    for (let i = 0; i < limitMonths; i++) {
      const ref = addUtcMonthsStart(y, m, -i);
      const refYear = ref.getUTCFullYear();
      const refMonth = ref.getUTCMonth();
      if (refYear < ownerStartYear || (refYear === ownerStartYear && refMonth < ownerStartMonth)) {
        break;
      }
      slots.push({ year: refYear, month: refMonth + 1 });
    }

    if (slots.length === 0) {
      return [];
    }

    const oldest = slots[slots.length - 1]!;
    const beforeOldest = addUtcMonthsStart(oldest.year, oldest.month - 1, -1);
    const { start: beforeStart, endExclusive: beforeEnd } = utcMonthRange(
      beforeOldest.getUTCFullYear(),
      beforeOldest.getUTCMonth(),
    );

    const metricsPromises = slots.map((s) => {
      const { start, endExclusive } = utcMonthRange(s.year, s.month - 1);
      return this.monthRevenueAndCount(ownerId, start, endExclusive);
    });
    const beforeOldestMetrics = this.monthRevenueAndCount(ownerId, beforeStart, beforeEnd);
    const metricsList = await Promise.all([...metricsPromises, beforeOldestMetrics]);

    const beforeMetrics = metricsList[metricsList.length - 1]!;
    const perMonth = metricsList.slice(0, -1);

    return slots.map((slot, i) => {
      const cur = perMonth[i]!;
      const prev = i < perMonth.length - 1 ? perMonth[i + 1]! : beforeMetrics;
      return {
        year: slot.year,
        month: slot.month,
        revenue: cur.revenue,
        bookingsCount: cur.bookings,
        growthPercent: pctChange(cur.revenue, prev.revenue),
      };
    });
  }

  async revenueMonthBookings(ownerId: string, year: number, month: number): Promise<DashboardRevenueMonthBookingRow[]> {
    const { start, endExclusive } = utcMonthRange(year, month - 1);
    const rows = await this.db.booking.findMany({
      where: { ownerId, startsAt: { gte: start, lt: endExclusive } },
      include: { client: true, service: true },
      orderBy: { startsAt: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      clientName: row.client.name,
      serviceName: row.service.name,
      startsAt: row.startsAt,
      price: row.price,
      paidAmount: row.paidAmount,
      amount: this.effectiveBookingAmount(row.paidAmount, row.price),
      status: row.status as "confirmed" | "pending" | "cancelled",
    }));
  }
}
