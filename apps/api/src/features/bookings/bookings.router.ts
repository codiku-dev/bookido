import { UnauthorizedException } from "@nestjs/common";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import { BaseUserSession } from "@thallesp/nestjs-better-auth";

import { AuthGuard } from "@api/src/infrastructure/decorators/auth/auth-guard.decorator";

import {
  bookingOutputSchema,
  createBookingInputSchema,
  listBookingsInputSchema,
  markBookingsListViewedInputSchema,
  updateBookingInputSchema,
  type CreateBookingInput,
  type ListBookingsInput,
  type MarkBookingsListViewedInput,
  type UpdateBookingInput,
} from "./bookings.schema";
import { BookingsService } from "./bookings.service";

function requireUserId(ctx: BaseUserSession): string {
  const id = ctx.user?.id;
  if (!id) {
    throw new UnauthorizedException();
  }
  return id;
}

@Router({ alias: "bookings" })
@AuthGuard({ logs: true })
export class BookingsRouter {
  constructor(private readonly bookingsService: BookingsService) {}

  @Query({
    input: listBookingsInputSchema,
    output: z.array(bookingOutputSchema),
  })
  list(@Ctx() ctx: BaseUserSession, @Input() input: ListBookingsInput) {
    const ownerId = requireUserId(ctx);
    return this.bookingsService.list(ownerId, input);
  }

  @Query({
    input: z.object({ id: z.string() }),
    output: bookingOutputSchema,
  })
  getById(@Ctx() ctx: BaseUserSession, @Input("id") id: string) {
    const ownerId = requireUserId(ctx);
    return this.bookingsService.getById(ownerId, id);
  }

  @Query({
    output: z.number().int(),
  })
  clientBadgeCount(@Ctx() ctx: BaseUserSession) {
    const ownerId = requireUserId(ctx);
    return this.bookingsService.countUnseenClientBookings(ownerId);
  }

  @Mutation({
    input: createBookingInputSchema,
    output: bookingOutputSchema,
  })
  create(@Ctx() ctx: BaseUserSession, @Input() input: CreateBookingInput) {
    const ownerId = requireUserId(ctx);
    return this.bookingsService.create(ownerId, input);
  }

  @Mutation({
    input: z.object({
      id: z.string(),
      data: updateBookingInputSchema,
    }),
    output: bookingOutputSchema,
  })
  update(
    @Ctx() ctx: BaseUserSession,
    @Input("id") id: string,
    @Input("data") data: UpdateBookingInput,
  ) {
    const ownerId = requireUserId(ctx);
    return this.bookingsService.update(ownerId, id, data);
  }

  @Mutation({
    input: z.object({ id: z.string() }),
    output: z.object({ id: z.string() }),
  })
  delete(@Ctx() ctx: BaseUserSession, @Input("id") id: string) {
    const ownerId = requireUserId(ctx);
    return this.bookingsService.remove(ownerId, id);
  }

  @Mutation({
    input: markBookingsListViewedInputSchema,
    output: z.object({ ok: z.literal(true) }),
  })
  markBookingsListViewed(@Ctx() ctx: BaseUserSession, @Input() _input: MarkBookingsListViewedInput) {
    const ownerId = requireUserId(ctx);
    return this.bookingsService.markBookingsListViewed(ownerId);
  }
}
