import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { BookingPaidConfirmation, emailBookidoLogoCidSrc } from "@repo/emails";

import { RESERVED_PUBLIC_BOOKING_SLUGS } from "@api/src/common/reserved-public-booking-slugs";
import { PrismaService } from "@api/src/infrastructure/prisma/prisma.service";
import { BookingsService } from "@api/src/features/bookings/bookings.service";
import { ProfileService, resolveUserDisplayImage } from "@api/src/features/profile/profile.service";
import { ServicesService } from "@api/src/features/services/services.service";
import { StripeService } from "@api/src/features/stripe/stripe.service";
import { sendEmail } from "@api/src/libs/email-libs";

import type {
  PublicBookingConfirmCheckoutInput,
  PublicBookingCreateCheckoutSessionInput,
  PublicBookingRequestInput,
} from "./public-booking.schema";

@Injectable()
export class PublicBookingService {
  private static readonly APPLICATION_FEE_BPS = 150;

  constructor(
    private readonly db: PrismaService,
    private readonly profileService: ProfileService,
    private readonly servicesService: ServicesService,
    private readonly bookingsService: BookingsService,
    private readonly stripeService: StripeService,
  ) {}

  private getNoticeThresholdMs(minNoticeHours: number) {
    const safeHours = Math.max(0, minNoticeHours);
    return Date.now() + safeHours * 60 * 60 * 1000;
  }

  private async resolveCoachBySlug(coachSlug: string) {
    const normalized = coachSlug.trim().toLowerCase();
    if (!normalized || RESERVED_PUBLIC_BOOKING_SLUGS.has(normalized)) {
      throw new NotFoundException("COACH_NOT_FOUND");
    }
    const row = await this.db.user.findFirst({
      where: { publicBookingSlug: normalized, archivedAt: null },
      select: {
        id: true,
        name: true,
        bio: true,
        address: true,
        publicBookingMinNoticeHours: true,
        stripeAccountId: true,
        stripeChargesEnabled: true,
        image: true,
        userAvatar: { select: { imageData: true } },
      },
    });
    if (row) {
      return {
        id: row.id,
        name: row.name,
        bio: row.bio,
        address: row.address,
        publicBookingMinNoticeHours: row.publicBookingMinNoticeHours,
        stripeAccountId: row.stripeAccountId,
        stripeChargesEnabled: row.stripeChargesEnabled,
        image: resolveUserDisplayImage(row),
      };
    }

    const orphans = await this.db.user.findMany({
      where: { publicBookingSlug: null, archivedAt: null },
      select: {
        id: true,
        name: true,
        bio: true,
        address: true,
        publicBookingMinNoticeHours: true,
        stripeAccountId: true,
        stripeChargesEnabled: true,
        image: true,
        userAvatar: { select: { imageData: true } },
      },
    });
    const hits = orphans.filter(
      (u) => this.profileService.initialPublicBookingSlugCandidate(u.id, u.name) === normalized,
    );
    if (hits.length !== 1) {
      throw new NotFoundException("COACH_NOT_FOUND");
    }
    const u = hits[0]!;
    const updated = await this.db.user.updateMany({
      where: { id: u.id, publicBookingSlug: null },
      data: { publicBookingSlug: normalized },
    });
    if (updated.count === 0) {
      const raced = await this.db.user.findFirst({
        where: { publicBookingSlug: normalized, archivedAt: null },
        select: {
          id: true,
          name: true,
          bio: true,
          address: true,
          publicBookingMinNoticeHours: true,
          stripeAccountId: true,
          stripeChargesEnabled: true,
          image: true,
          userAvatar: { select: { imageData: true } },
        },
      });
      if (raced) {
        return {
          id: raced.id,
          name: raced.name,
          bio: raced.bio,
          address: raced.address,
          publicBookingMinNoticeHours: raced.publicBookingMinNoticeHours,
          stripeAccountId: raced.stripeAccountId,
          stripeChargesEnabled: raced.stripeChargesEnabled,
          image: resolveUserDisplayImage(raced),
        };
      }
      throw new NotFoundException("COACH_NOT_FOUND");
    }
    return {
      id: u.id,
      name: u.name,
      bio: u.bio,
      address: u.address,
      publicBookingMinNoticeHours: u.publicBookingMinNoticeHours,
      stripeAccountId: u.stripeAccountId,
      stripeChargesEnabled: u.stripeChargesEnabled,
      image: resolveUserDisplayImage(u),
    };
  }

  private applicationFeeAmountFromTotalCents(totalCents: number) {
    const raw = Math.round((totalCents * PublicBookingService.APPLICATION_FEE_BPS) / 10_000);
    if (totalCents <= 0) {
      return 0;
    }
    return Math.max(1, raw);
  }

  private async sendPaidBookingConfirmationEmail(p: {
    locale: "fr" | "en";
    clientEmail: string;
    clientName: string;
    coachName: string;
    coachImageUrl?: string | null;
    serviceName: string;
    serviceDurationMinutes: number;
    servicePackSize: number;
    paidAmountEur: number;
    serviceAddress: string;
    serviceMapsUrl?: string | null;
    sessionsStartsAtIso: string[];
  }) {
    const dateLocale = p.locale === "fr" ? "fr-FR" : "en-US";
    const amountLocale = p.locale === "fr" ? "fr-FR" : "en-US";
    const amountLabel = new Intl.NumberFormat(amountLocale, {
      style: "currency",
      currency: "EUR",
    }).format(p.paidAmountEur);
    const sessions = p.sessionsStartsAtIso
      .map((value) => new Date(value))
      .filter((value) => !Number.isNaN(value.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())
      .map((value) => ({
        startAtLabel: new Intl.DateTimeFormat(dateLocale, {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(value),
      }));

    await sendEmail({
      to: p.clientEmail,
      subject: p.locale === "fr" ? "Reservation confirmee - recapitulatif de votre reservation" : "Booking confirmed - your booking summary",
      component: BookingPaidConfirmation({
        locale: p.locale,
        brandLogoSrc: emailBookidoLogoCidSrc(),
        clientName: p.clientName,
        coachName: p.coachName,
        coachImageUrl: p.coachImageUrl,
        serviceName: p.serviceName,
        serviceDurationMinutes: p.serviceDurationMinutes,
        servicePackSize: p.servicePackSize,
        paidAmountLabel: amountLabel,
        serviceAddress: p.serviceAddress,
        serviceMapsUrl: p.serviceMapsUrl,
        sessions,
      }),
    });
  }

  async getStorefront(coachSlug: string, rangeFrom: Date, rangeTo: Date) {
    const coach = await this.resolveCoachBySlug(coachSlug);
    const ownerUserId = coach.id;

    const [availability, services, bookingRows] = await Promise.all([
      this.profileService.getCalendarAvailability(ownerUserId),
      this.servicesService.findAllForUser(ownerUserId),
      this.db.booking.findMany({
        where: {
          ownerId: ownerUserId,
          status: { not: "cancelled" },
          startsAt: { lte: rangeTo },
        },
        select: { startsAt: true, durationMinutes: true, status: true },
      }),
    ]);

    const fromMs = rangeFrom.getTime();
    const toMs = rangeTo.getTime();
    const noticeThresholdMs = this.getNoticeThresholdMs(coach.publicBookingMinNoticeHours);
    const bookingSegments = bookingRows
      .filter((b) => {
        if (b.startsAt.getTime() < noticeThresholdMs) {
          return false;
        }
        const end = b.startsAt.getTime() + b.durationMinutes * 60_000;
        return end > fromMs && b.startsAt.getTime() < toMs;
      })
      .map((b) => ({
        startsAt: b.startsAt.toISOString(),
        durationMinutes: b.durationMinutes,
        status: b.status,
      }));

    return {
      coach: {
        name: coach.name,
        bio: coach.bio,
        imageUrl: coach.image,
      },
      weekHours: availability.weekHours,
      closedSlotKeys: availability.closedSlotKeys,
      minBookingNoticeHours: coach.publicBookingMinNoticeHours,
      services: services.filter((s) => s.isPublished).map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        imageUrl: s.imageUrl,
        address: s.address,
        durationMinutes: s.durationMinutes,
        packSize: s.packSize,
        price: s.price,
        isFree: s.isFree,
        requiresValidation: s.requiresValidation,
      })),
      bookingSegments,
    };
  }

  async requestBooking(
    input: PublicBookingRequestInput,
    options?: { markAsPaid?: boolean; paymentMethodLabel?: string },
  ) {
    const coach = await this.resolveCoachBySlug(input.coachSlug);
    const ownerUserId = coach.id;

    const service = await this.db.service.findFirst({
      where: { id: input.serviceId, userId: ownerUserId },
    });
    if (!service) {
      throw new NotFoundException("SERVICE_NOT_FOUND");
    }

    const packSize = Math.max(1, service.packSize);
    if (input.sessionsStartsAt.length !== packSize) {
      throw new BadRequestException("PACK_SESSION_COUNT_MISMATCH");
    }

    const noticeThresholdMs = this.getNoticeThresholdMs(coach.publicBookingMinNoticeHours);
    const durationMs = service.durationMinutes * 60_000;

    const parsed = input.sessionsStartsAt.map((raw) => {
      const startsAt = new Date(raw);
      if (Number.isNaN(startsAt.getTime())) {
        throw new BadRequestException("INVALID_STARTS_AT");
      }
      if (startsAt.getTime() < noticeThresholdMs) {
        throw new BadRequestException("SLOT_TOO_SOON");
      }
      return startsAt;
    });

    const uniqueIso = new Set(parsed.map((d) => d.toISOString()));
    if (uniqueIso.size !== parsed.length) {
      throw new BadRequestException("DUPLICATE_SESSION_START");
    }

    const intervals = parsed.map((start) => ({
      startMs: start.getTime(),
      endMs: start.getTime() + durationMs,
    }));

    for (let i = 0; i < intervals.length; i += 1) {
      for (let j = i + 1; j < intervals.length; j += 1) {
        const a = intervals[i]!;
        const b = intervals[j]!;
        if (a.endMs > b.startMs && b.endMs > a.startMs) {
          throw new BadRequestException("SESSIONS_OVERLAP");
        }
      }
    }

    const maxEnd = new Date(Math.max(...intervals.map((x) => x.endMs)));

    const candidates = await this.db.booking.findMany({
      where: {
        ownerId: ownerUserId,
        status: { not: "cancelled" },
        startsAt: { lt: maxEnd },
      },
      select: { startsAt: true, durationMinutes: true },
    });

    for (const interval of intervals) {
      for (const b of candidates) {
        const bStart = b.startsAt.getTime();
        const bEnd = bStart + b.durationMinutes * 60_000;
        if (bEnd > interval.startMs && bStart < interval.endMs) {
          throw new ConflictException("SLOT_UNAVAILABLE");
        }
      }
    }

    const email = input.clientEmail.trim().toLowerCase();
    const normalizedClientName = input.clientName.trim();
    const normalizedClientPhone = (input.clientPhone ?? "").trim();

    const status = service.requiresValidation ? ("pending" as const) : ("confirmed" as const);
    const sorted = [...parsed].sort((a, b) => a.getTime() - b.getTime());
    const totalPackCents = service.isFree ? 0 : Math.round(service.price * 100);

    const markAsPaid = options?.markAsPaid ?? false;
    const paymentMethodLabel = options?.paymentMethodLabel?.trim() || "—";

    return this.db.$transaction(async (tx) => {
      const client = await tx.client.upsert({
        where: {
          ownerId_email: {
            ownerId: ownerUserId,
            email,
          },
        },
        create: {
          ownerId: ownerUserId,
          name: normalizedClientName,
          email,
          phone: normalizedClientPhone.length > 0 ? normalizedClientPhone : "—",
        },
        update: {
          // Always refresh from checkout form values to avoid stale CRM data.
          name: normalizedClientName,
          phone: normalizedClientPhone.length > 0 ? normalizedClientPhone : "—",
        },
      });

      let lastRow: Awaited<ReturnType<BookingsService["create"]>> | null = null;
      for (let idx = 0; idx < sorted.length; idx += 1) {
        const startsAt = sorted[idx]!;
        // For multi-session packs, persist the full pack price on the first session
        // and keep the follow-up sessions at 0 to avoid splitting one purchase into many partial prices.
        const sessionCents = service.isFree ? 0 : idx === 0 ? totalPackCents : 0;
        const sessionPrice = sessionCents / 100;
        const sessionPaidAmount = markAsPaid ? sessionPrice : 0;
        lastRow = await this.bookingsService.create(
          ownerUserId,
          {
            clientId: client.id,
            serviceId: service.id,
            startsAt: startsAt.toISOString(),
            durationMinutes: service.durationMinutes,
            price: sessionPrice,
            paidAmount: sessionPaidAmount,
            status,
            notes: undefined,
            location: service.address ?? coach.address ?? "",
            paymentMethod: paymentMethodLabel,
            createdByClient: true,
          },
          { tx },
        );
      }
      return lastRow!;
    });
  }

  async createCheckoutSession(input: PublicBookingCreateCheckoutSessionInput): Promise<{ url: string }> {
    let coach = await this.resolveCoachBySlug(input.coachSlug);
    if (coach.stripeAccountId && !coach.stripeChargesEnabled) {
      await this.stripeService.syncConnectStatusFromAccountId(coach.stripeAccountId);
      coach = await this.resolveCoachBySlug(input.coachSlug);
    }
    if (!coach.stripeAccountId || !coach.stripeChargesEnabled) {
      throw new BadRequestException("STRIPE_NOT_READY");
    }

    const service = await this.db.service.findFirst({
      where: { id: input.serviceId, userId: coach.id },
    });
    if (!service) {
      throw new NotFoundException("SERVICE_NOT_FOUND");
    }
    if (service.isFree || service.price <= 0) {
      throw new BadRequestException("SERVICE_IS_FREE");
    }

    const packSize = Math.max(1, service.packSize);
    if (input.sessionsStartsAt.length !== packSize) {
      throw new BadRequestException("PACK_SESSION_COUNT_MISMATCH");
    }

    const noticeThresholdMs = this.getNoticeThresholdMs(coach.publicBookingMinNoticeHours);
    const durationMs = service.durationMinutes * 60_000;

    const parsed = input.sessionsStartsAt.map((raw) => {
      const startsAt = new Date(raw);
      if (Number.isNaN(startsAt.getTime())) {
        throw new BadRequestException("INVALID_STARTS_AT");
      }
      if (startsAt.getTime() < noticeThresholdMs) {
        throw new BadRequestException("SLOT_TOO_SOON");
      }
      return startsAt;
    });

    const uniqueIso = new Set(parsed.map((d) => d.toISOString()));
    if (uniqueIso.size !== parsed.length) {
      throw new BadRequestException("DUPLICATE_SESSION_START");
    }

    const intervals = parsed.map((start) => ({
      startMs: start.getTime(),
      endMs: start.getTime() + durationMs,
    }));

    for (let i = 0; i < intervals.length; i += 1) {
      for (let j = i + 1; j < intervals.length; j += 1) {
        const a = intervals[i]!;
        const b = intervals[j]!;
        if (a.endMs > b.startMs && b.endMs > a.startMs) {
          throw new BadRequestException("SESSIONS_OVERLAP");
        }
      }
    }

    const maxEnd = new Date(Math.max(...intervals.map((x) => x.endMs)));
    const candidates = await this.db.booking.findMany({
      where: {
        ownerId: coach.id,
        status: { not: "cancelled" },
        startsAt: { lt: maxEnd },
      },
      select: { startsAt: true, durationMinutes: true },
    });

    for (const interval of intervals) {
      for (const b of candidates) {
        const bStart = b.startsAt.getTime();
        const bEnd = bStart + b.durationMinutes * 60_000;
        if (bEnd > interval.startMs && bStart < interval.endMs) {
          throw new ConflictException("SLOT_UNAVAILABLE");
        }
      }
    }

    const frontendUrlRaw = process.env["FRONTEND_URL"]?.trim();
    if (!frontendUrlRaw) {
      throw new BadRequestException("FRONTEND_URL_MISSING");
    }
    const frontendUrl = frontendUrlRaw.replace(/\/+$/g, "");
    const bookingPageBase = `${frontendUrl}/${encodeURIComponent(input.coachSlug)}/booking`;
    const successUrl = `${bookingPageBase}?service=${encodeURIComponent(input.serviceId)}&checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${bookingPageBase}?service=${encodeURIComponent(input.serviceId)}&checkout=cancel`;

    const totalCents = Math.round(service.price * 100);
    const applicationFeeAmount = this.applicationFeeAmountFromTotalCents(totalCents);
    const stripe = this.stripeService.getStripeClient();
    const normalizedClientEmail = input.clientEmail.trim().toLowerCase();
    const normalizedClientName = input.clientName.trim();

    const existingCustomers = await stripe.customers.list(
      {
        email: normalizedClientEmail,
        limit: 1,
      },
      {
        stripeAccount: coach.stripeAccountId,
      },
    );
    let checkoutCustomer = existingCustomers.data[0];
    if (!checkoutCustomer) {
      checkoutCustomer = await stripe.customers.create(
        {
          email: normalizedClientEmail,
          name: normalizedClientName,
        },
        {
          stripeAccount: coach.stripeAccountId,
        },
      );
    } else if (checkoutCustomer.name?.trim() !== normalizedClientName) {
      checkoutCustomer = await stripe.customers.update(
        checkoutCustomer.id,
        {
          name: normalizedClientName,
          email: normalizedClientEmail,
        },
        {
          stripeAccount: coach.stripeAccountId,
        },
      );
    }
    const servicePackSize = Math.max(1, service.packSize);
    const serviceDescriptionParts = [
      `${service.durationMinutes} min`,
      `${servicePackSize} séance${servicePackSize > 1 ? "s" : ""}`,
      service.description?.trim() ?? "",
    ].filter((part) => part.length > 0);
    const stripeProductDescription = serviceDescriptionParts.join(" • ");
    const stripeProductImages =
      service.imageUrl && /^https?:\/\//i.test(service.imageUrl) ? [service.imageUrl] : undefined;

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer: checkoutCustomer.id,
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: service.name,
                description: stripeProductDescription,
                images: stripeProductImages,
              },
              unit_amount: totalCents,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          paymentFlow: "new_public_booking",
          ownerUserId: coach.id,
          coachSlug: input.coachSlug,
          serviceId: input.serviceId,
          sessionsStartsAtJson: JSON.stringify(input.sessionsStartsAt),
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          clientPhone: input.clientPhone ?? "",
          locale: input.locale ?? "fr",
          bookingCreated: "0",
        },
      },
      {
        stripeAccount: coach.stripeAccountId,
      },
    );

    if (!session.url) {
      throw new BadRequestException("CHECKOUT_SESSION_URL_MISSING");
    }
    return { url: session.url };
  }

  async confirmCheckoutAndCreateBooking(input: PublicBookingConfirmCheckoutInput): Promise<{ ok: true }> {
    const coach = await this.resolveCoachBySlug(input.coachSlug);
    if (!coach.stripeAccountId) {
      throw new BadRequestException("STRIPE_NOT_READY");
    }
    const stripe = this.stripeService.getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(
      input.sessionId,
      {},
      { stripeAccount: coach.stripeAccountId },
    );
    if (session.mode !== "payment" || session.status !== "complete" || session.payment_status !== "paid") {
      throw new BadRequestException("CHECKOUT_NOT_PAID");
    }

    const metadata = session.metadata ?? {};
    const paymentFlow = metadata["paymentFlow"] ?? "new_public_booking";
    const pendingBookingId = metadata["bookingId"] ?? "";
    const ownerUserId = metadata["ownerUserId"] ?? "";
    const coachSlug = metadata["coachSlug"] ?? "";
    const serviceId = metadata["serviceId"] ?? "";
    const sessionsStartsAtJson = metadata["sessionsStartsAtJson"] ?? "[]";
    const clientName = metadata["clientName"] ?? "";
    const clientEmail = metadata["clientEmail"] ?? "";
    const clientPhone = metadata["clientPhone"] ?? "";
    const localeRaw = metadata["locale"] ?? "fr";
    const locale: "fr" | "en" = localeRaw === "en" ? "en" : "fr";
    const bookingCreated = metadata["bookingCreated"] ?? "0";

    if (ownerUserId !== coach.id || coachSlug.toLowerCase() !== input.coachSlug.toLowerCase()) {
      throw new BadRequestException("CHECKOUT_MISMATCH");
    }
    if (bookingCreated === "1") {
      return { ok: true };
    }

    if (paymentFlow === "pending_booking_confirmation") {
      if (!pendingBookingId) {
        throw new BadRequestException("CHECKOUT_METADATA_INVALID");
      }
      const pendingBooking = await this.db.booking.findFirst({
        where: { id: pendingBookingId, ownerId: coach.id },
        include: {
          client: true,
          service: true,
        },
      });
      if (!pendingBooking) {
        throw new NotFoundException("BOOKING_NOT_FOUND");
      }
      if (pendingBooking.status === "cancelled") {
        throw new BadRequestException("BOOKING_CANCELLED");
      }
      const paidAmount = Math.min(pendingBooking.price, Math.max(0, pendingBooking.price));
      await this.db.booking.update({
        where: { id: pendingBooking.id },
        data: {
          status: "confirmed",
          hostValidationAccepted: true,
          paidAmount,
          paymentMethod: "Stripe Checkout",
        },
      });
      const serviceMapsUrl =
        pendingBooking.service.address.trim().length > 0
          ? `https://www.google.com/maps?q=${encodeURIComponent(pendingBooking.service.address)}`
          : null;
      try {
        await this.sendPaidBookingConfirmationEmail({
          locale,
          clientEmail: pendingBooking.client.email,
          clientName: pendingBooking.client.name,
          coachName: coach.name,
          coachImageUrl: coach.image,
          serviceName: pendingBooking.service.name,
          serviceDurationMinutes: pendingBooking.service.durationMinutes,
          servicePackSize: Math.max(1, pendingBooking.service.packSize),
          paidAmountEur: pendingBooking.price,
          serviceAddress: pendingBooking.service.address,
          serviceMapsUrl,
          sessionsStartsAtIso: [pendingBooking.startsAt.toISOString()],
        });
      } catch {
        // Keep booking confirmation resilient even if SMTP is temporarily unavailable.
      }
      await stripe.checkout.sessions.update(
        session.id,
        {
          metadata: {
            ...metadata,
            bookingCreated: "1",
          },
        },
        { stripeAccount: coach.stripeAccountId },
      );
      return { ok: true };
    }

    let sessionsStartsAt: string[];
    try {
      const parsed = JSON.parse(sessionsStartsAtJson);
      if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
        throw new Error("INVALID_SESSIONS_JSON");
      }
      sessionsStartsAt = parsed;
    } catch {
      throw new BadRequestException("CHECKOUT_METADATA_INVALID");
    }

    try {
      await this.requestBooking(
        {
          coachSlug,
          serviceId,
          sessionsStartsAt,
          clientName,
          clientEmail,
          clientPhone: clientPhone.length > 0 ? clientPhone : undefined,
          locale,
        },
        {
          markAsPaid: true,
          paymentMethodLabel: "Stripe Checkout",
        },
      );
    } catch (error) {
      if (
        error instanceof ConflictException &&
        (error.message === "SLOT_UNAVAILABLE" || error.message.includes("SLOT_UNAVAILABLE"))
      ) {
        await stripe.checkout.sessions.update(
          session.id,
          {
            metadata: {
              ...metadata,
              bookingCreated: "1",
            },
          },
          { stripeAccount: coach.stripeAccountId },
        );
        return { ok: true };
      }
      throw error;
    }

    const service = await this.db.service.findFirst({
      where: { id: serviceId, userId: coach.id },
      select: {
        name: true,
        durationMinutes: true,
        packSize: true,
        address: true,
        price: true,
      },
    });
    if (service) {
      const serviceMapsUrl =
        service.address.trim().length > 0
          ? `https://www.google.com/maps?q=${encodeURIComponent(service.address)}`
          : null;
      try {
        await this.sendPaidBookingConfirmationEmail({
          locale,
          clientEmail,
          clientName,
          coachName: coach.name,
          coachImageUrl: coach.image,
          serviceName: service.name,
          serviceDurationMinutes: service.durationMinutes,
          servicePackSize: Math.max(1, service.packSize),
          paidAmountEur: service.price,
          serviceAddress: service.address,
          serviceMapsUrl,
          sessionsStartsAtIso: sessionsStartsAt,
        });
      } catch {
        // Keep booking confirmation resilient even if SMTP is temporarily unavailable.
      }
    }

    await stripe.checkout.sessions.update(
      session.id,
      {
        metadata: {
          ...metadata,
          bookingCreated: "1",
        },
      },
      { stripeAccount: coach.stripeAccountId },
    );

    return { ok: true };
  }
}
