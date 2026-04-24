import { UnauthorizedException } from "@nestjs/common";
import { Ctx, Input, Query, Router } from "nestjs-trpc";
import { BaseUserSession } from "@thallesp/nestjs-better-auth";

import { AuthGuard } from "@api/src/infrastructure/decorators/auth/auth-guard.decorator";

import {
  dashboardOverviewInputSchema,
  dashboardOverviewOutputSchema,
  dashboardRevenueMonthBookingsInputSchema,
  dashboardRevenueMonthBookingsOutputSchema,
  dashboardRevenueMonthsInputSchema,
  dashboardRevenueMonthsOutputSchema,
  type DashboardOverviewInput,
  type DashboardRevenueMonthBookingsInput,
  type DashboardRevenueMonthsInput,
} from "./dashboard.schema";
import { DashboardService } from "./dashboard.service";

function requireUserId(ctx: BaseUserSession): string {
  const id = ctx.user?.id;
  if (!id) {
    throw new UnauthorizedException();
  }
  return id;
}

@Router({ alias: "dashboard" })
@AuthGuard({ logs: true })
export class DashboardRouter {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query({
    input: dashboardOverviewInputSchema,
    output: dashboardOverviewOutputSchema,
  })
  overview(@Ctx() ctx: BaseUserSession, @Input() input: DashboardOverviewInput) {
    const ownerId = requireUserId(ctx);
    return this.dashboardService.overview(ownerId, input);
  }

  @Query({
    input: dashboardRevenueMonthsInputSchema,
    output: dashboardRevenueMonthsOutputSchema,
  })
  revenueMonths(@Ctx() ctx: BaseUserSession, @Input() input: DashboardRevenueMonthsInput) {
    const ownerId = requireUserId(ctx);
    return this.dashboardService.revenueMonths(ownerId, input.limitMonths);
  }

  @Query({
    input: dashboardRevenueMonthBookingsInputSchema,
    output: dashboardRevenueMonthBookingsOutputSchema,
  })
  revenueMonthBookings(@Ctx() ctx: BaseUserSession, @Input() input: DashboardRevenueMonthBookingsInput) {
    const ownerId = requireUserId(ctx);
    return this.dashboardService.revenueMonthBookings(ownerId, input.year, input.month);
  }
}
