import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { BaseUserSession } from "@thallesp/nestjs-better-auth";

import { AuthGuard } from "@api/src/infrastructure/decorators/auth/auth-guard.decorator";
import {
  calendarAvailabilityOutputSchema,
  publicBookingPresenceOutputSchema,
  platformBillingHistoryOutputSchema,
  stripeConnectStatusOutputSchema,
  updateCalendarAvailabilityInputSchema,
  adminOnboardingStatusOutputSchema,
  saveAdminOnboardingStepInputSchema,
  updateProfileAvatarInputSchema,
  updateProfileBasicsInputSchema,
  updatePublicBookingPresenceInputSchema,
  type UpdateProfileAvatarInput,
  type UpdateProfileBasicsInput,
  type UpdatePublicBookingPresenceInput,
} from "./profile.schema";
import { ProfileService } from "./profile.service";

@Router({ alias: "profile" })
@AuthGuard({ logs: true })
export class ProfileRouter {
  constructor(private readonly profileService: ProfileService) { }

  private requireUser(ctx: BaseUserSession): { id: string } {
    const user = ctx.user;
    if (!user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
    }
    return { id: user.id };
  }

  @Query({
    output: adminOnboardingStatusOutputSchema,
  })
  getAdminOnboardingStatus(@Ctx() ctx: BaseUserSession) {
    const { id } = this.requireUser(ctx);
    return this.profileService.getAdminOnboardingStatus(id);
  }

  @Mutation({
    input: z.object({}),
    output: z.object({ ok: z.literal(true) }),
  })
  completeAdminOnboarding(@Ctx() ctx: BaseUserSession) {
    const { id } = this.requireUser(ctx);
    return this.profileService.completeAdminOnboarding(id);
  }

  @Mutation({
    input: saveAdminOnboardingStepInputSchema,
    output: z.object({ ok: z.literal(true) }),
  })
  saveAdminOnboardingStep(
    @Ctx() ctx: BaseUserSession,
    @Input() input: z.infer<typeof saveAdminOnboardingStepInputSchema>,
  ) {
    const { id } = this.requireUser(ctx);
    return this.profileService.saveAdminOnboardingStep(id, input.step);
  }

  @Query({
    output: calendarAvailabilityOutputSchema,
  })
  async getCalendarAvailability(@Ctx() ctx: BaseUserSession) {
    const { id } = this.requireUser(ctx);
    return this.profileService.getCalendarAvailability(id);
  }

  @Query({
    output: stripeConnectStatusOutputSchema,
  })
  getStripeConnectStatus(@Ctx() ctx: BaseUserSession) {
    const { id } = this.requireUser(ctx);
    return this.profileService.getStripeConnectStatus(id);
  }

  @Query({
    output: platformBillingHistoryOutputSchema,
  })
  getPlatformBillingHistory(@Ctx() ctx: BaseUserSession) {
    const { id } = this.requireUser(ctx);
    return this.profileService.getPlatformBillingHistory(id);
  }

  @Mutation({
    input: updateCalendarAvailabilityInputSchema,
    output: z.object({ ok: z.literal(true) }),
  })
  async updateCalendarAvailability(
    @Ctx() ctx: BaseUserSession,
    @Input() input: z.infer<typeof updateCalendarAvailabilityInputSchema>,
  ) {
    const { id } = this.requireUser(ctx);
    return this.profileService.updateCalendarAvailability(id, input);
  }

  @Query({
    output: publicBookingPresenceOutputSchema,
  })
  getPublicBookingPresence(@Ctx() ctx: BaseUserSession) {
    const { id } = this.requireUser(ctx);
    return this.profileService.getPublicBookingPresence(id);
  }

  @Mutation({
    input: updatePublicBookingPresenceInputSchema,
    output: z.object({ ok: z.literal(true) }),
  })
  updatePublicBookingPresence(@Ctx() ctx: BaseUserSession, @Input() input: UpdatePublicBookingPresenceInput) {
    const { id } = this.requireUser(ctx);
    return this.profileService.updatePublicBookingPresence(id, input);
  }

  @Mutation({
    input: updateProfileBasicsInputSchema,
    output: z.object({ ok: z.literal(true) }),
  })
  updateProfileBasics(@Ctx() ctx: BaseUserSession, @Input() input: UpdateProfileBasicsInput) {
    const { id } = this.requireUser(ctx);
    return this.profileService.updateProfileBasics(id, input);
  }

  @Mutation({
    input: updateProfileAvatarInputSchema,
    output: z.object({ ok: z.literal(true) }),
  })
  updateProfileAvatar(@Ctx() ctx: BaseUserSession, @Input() input: UpdateProfileAvatarInput) {
    const { id } = this.requireUser(ctx);
    return this.profileService.updateProfileAvatar(id, input);
  }

  @Mutation({
    input: z.object({}),
    output: z.object({ url: z.string().url() }),
  })
  createStripeOnboardingLink(@Ctx() ctx: BaseUserSession) {
    const { id } = this.requireUser(ctx);
    return this.profileService.createStripeOnboardingLink(id);
  }

  @Mutation({
    input: z.object({}),
    output: z.object({ url: z.string().url() }),
  })
  createStripeConnectAccountUpdateLink(@Ctx() ctx: BaseUserSession) {
    const { id } = this.requireUser(ctx);
    return this.profileService.createStripeConnectAccountUpdateLink(id);
  }

  @Mutation({
    input: z.object({}),
    output: z.object({ clientSecret: z.string() }),
  })
  createStripeEmbeddedAccountSession(@Ctx() ctx: BaseUserSession) {
    const { id } = this.requireUser(ctx);
    return this.profileService.createStripeEmbeddedAccountSession(id);
  }

  @Mutation({
    input: z.object({
      confirmEmail: z.string().email(),
      password: z.string().optional(),
    }),
    output: z.object({ ok: z.literal(true) }),
  })
  archiveAccount(
    @Ctx() ctx: BaseUserSession,
    @Input() input: { confirmEmail: string; password?: string },
  ) {
    const user = ctx.user;
    if (!user?.id || !user.email) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
    }
    return this.profileService.archiveAccount({
      userId: user.id,
      sessionEmail: user.email,
      confirmEmail: input.confirmEmail,
      password: input.password,
    });
  }
}
