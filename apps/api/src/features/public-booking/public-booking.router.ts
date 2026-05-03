import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import { BaseUserSession } from "@thallesp/nestjs-better-auth";

import { AuthGuard } from "@api/src/infrastructure/decorators/auth/auth-guard.decorator";
import { Public } from "@api/src/infrastructure/decorators/auth/public-procedure.decorator";

import {
  publicBookingCancelByTokenInputSchema,
  publicBookingCancelByTokenOutputSchema,
  publicBookingGetCancelBookingPreviewInputSchema,
  publicBookingGetCancelBookingPreviewOutputSchema,
  publicBookingConfirmCheckoutInputSchema,
  publicBookingConfirmCheckoutOutputSchema,
  publicBookingCreateCheckoutSessionInputSchema,
  publicBookingCreateCheckoutSessionOutputSchema,
  publicBookingGetStorefrontInputSchema,
  publicBookingGetStorefrontOutputSchema,
  publicBookingRequestInputSchema,
  publicBookingRequestOutputSchema,
  type PublicBookingCancelByTokenInput,
  type PublicBookingGetCancelBookingPreviewInput,
  type PublicBookingConfirmCheckoutInput,
  type PublicBookingCreateCheckoutSessionInput,
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

  @Public()
  @Mutation({
    input: publicBookingCreateCheckoutSessionInputSchema,
    output: publicBookingCreateCheckoutSessionOutputSchema,
  })
  createCheckoutSession(@Ctx() _ctx: BaseUserSession, @Input() input: PublicBookingCreateCheckoutSessionInput) {
    return this.publicBookingService.createCheckoutSession(input);
  }

  @Public()
  @Mutation({
    input: publicBookingConfirmCheckoutInputSchema,
    output: publicBookingConfirmCheckoutOutputSchema,
  })
  confirmCheckout(@Ctx() _ctx: BaseUserSession, @Input() input: PublicBookingConfirmCheckoutInput) {
    return this.publicBookingService.confirmCheckoutAndCreateBooking(input);
  }

  @Public()
  @Query({
    input: publicBookingGetCancelBookingPreviewInputSchema,
    output: publicBookingGetCancelBookingPreviewOutputSchema,
  })
  getCancelBookingPreview(@Ctx() _ctx: BaseUserSession, @Input() input: PublicBookingGetCancelBookingPreviewInput) {
    return this.publicBookingService.getCancelBookingPreview(input);
  }

  @Public()
  @Mutation({
    input: publicBookingCancelByTokenInputSchema,
    output: publicBookingCancelByTokenOutputSchema,
  })
  cancelByToken(@Ctx() _ctx: BaseUserSession, @Input() input: PublicBookingCancelByTokenInput) {
    return this.publicBookingService.cancelBookingByToken(input);
  }
}
