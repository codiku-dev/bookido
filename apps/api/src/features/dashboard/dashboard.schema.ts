import { z } from "zod";

export const dashboardChartPeriodSchema = z.enum(["weekly", "monthly", "yearly", "custom"]);

export const dashboardOverviewInputSchema = z.object({
  chartPeriod: dashboardChartPeriodSchema,
  customFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  customTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type DashboardChartPeriod = z.infer<typeof dashboardChartPeriodSchema>;
export type DashboardOverviewInput = z.infer<typeof dashboardOverviewInputSchema>;

export const dashboardRecentBookingSchema = z.object({
  id: z.string(),
  clientName: z.string(),
  serviceName: z.string(),
  amount: z.number(),
  createdAt: z.coerce.date(),
});

export const dashboardOverviewOutputSchema = z.object({
  kpis: z.object({
    totalRevenue: z.number(),
    revenueThisMonth: z.number(),
    revenueTrendPercent: z.number().nullable(),
    clientsTotal: z.number().int(),
    clientsNewThisMonth: z.number().int(),
    clientsTrendPercent: z.number().nullable(),
    bookingsThisMonth: z.number().int(),
    bookingsTrendPercent: z.number().nullable(),
  }),
  revenueSeries: z.array(
    z.object({
      periodKey: z.string(),
      revenue: z.number(),
    }),
  ),
  salesSeries: z.array(
    z.object({
      periodKey: z.string(),
      sales: z.number(),
    }),
  ),
  recentBookings: z.array(dashboardRecentBookingSchema),
});

export type DashboardOverviewOutput = z.infer<typeof dashboardOverviewOutputSchema>;

export const dashboardRevenueMonthsInputSchema = z.object({
  limitMonths: z.number().int().min(1).max(36).default(24),
});

export type DashboardRevenueMonthsInput = z.infer<typeof dashboardRevenueMonthsInputSchema>;

export const dashboardRevenueMonthRowSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  revenue: z.number(),
  bookingsCount: z.number().int(),
  growthPercent: z.number().nullable(),
});

export const dashboardRevenueMonthsOutputSchema = z.array(dashboardRevenueMonthRowSchema);

export type DashboardRevenueMonthRow = z.infer<typeof dashboardRevenueMonthRowSchema>;

export const dashboardRevenueMonthBookingsInputSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
});

export type DashboardRevenueMonthBookingsInput = z.infer<typeof dashboardRevenueMonthBookingsInputSchema>;

export const dashboardRevenueMonthBookingRowSchema = z.object({
  id: z.string(),
  clientName: z.string(),
  serviceName: z.string(),
  startsAt: z.coerce.date(),
  price: z.number(),
  paidAmount: z.number(),
  amount: z.number(),
  status: z.enum(["confirmed", "pending", "cancelled"]),
});

export const dashboardRevenueMonthBookingsOutputSchema = z.array(dashboardRevenueMonthBookingRowSchema);

export type DashboardRevenueMonthBookingRow = z.infer<typeof dashboardRevenueMonthBookingRowSchema>;
