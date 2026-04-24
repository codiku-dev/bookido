import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import { BaseUserSession } from "@thallesp/nestjs-better-auth";

import { AuthGuard } from "@api/src/infrastructure/decorators/auth/auth-guard.decorator";
import { Public } from "@api/src/infrastructure/decorators/auth/public-procedure.decorator";

import {
  publicBookingGetStorefrontInputSchema,
  publicBookingGetStorefrontOutputSchema,
  publicBookingRequestInputSchema,
  publicBookingRequestOutputSchema,
  type PublicBookingGetStorefrontInput,
  type PublicBookingRequestInput,
} from "./public-booking.schema";
import { PublicBookingService } from "./public-booking.service";

@Router({ alias: "publicBooking" })
@AuthGuard({ logs: true })
export class PublicBookingRouter {
  constructor(private readonly publicBookingService: PublicBookingService) {}

  @Public()
  @Query({
    input: publicBookingGetStorefrontInputSchema,
    output: publicBookingGetStorefrontOutputSchema,
  })
  getStorefront(@Ctx() _ctx: BaseUserSession, @Input() input: PublicBookingGetStorefrontInput) {
    return this.publicBookingService.getStorefront(
      input.coachSlug,
      new Date(input.rangeFrom),
      new Date(input.rangeTo),
    );
  }

  @Public()
  @Mutation({
    input: publicBookingRequestInputSchema,
    output: publicBookingRequestOutputSchema,
  })
  request(@Ctx() _ctx: BaseUserSession, @Input() input: PublicBookingRequestInput) {
    return this.publicBookingService.requestBooking(input);
  }
}
