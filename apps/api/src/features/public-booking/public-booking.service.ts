import { BadRequestException, ConflictException, Injectable, Logger } from "@nestjs/common";
import { randomBytes, randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import {
  BookingPaidConfirmation,
  BookingProNewReservation,
  buildBookingSessionsIcs,
  emailBookidoLogoCidSrc,
} from "@repo/emails";

import { RESERVED_PUBLIC_BOOKING_SLUGS } from "@api/src/common/reserved-public-booking-slugs";
import { PrismaService } from "@api/src/infrastructure/prisma/prisma.service";
import { plainTextFromHtml } from "@api/src/utils/rich-text-plain";
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
  private readonly logger = new Logger(PublicBookingService.name);

  constructor(
    private readonly db: PrismaService,
    private readonly profileService: ProfileService,
    private readonly servicesService: ServicesService,
    private readonly bookingsService: BookingsService,
    private readonly stripeService: StripeService,
  ) {}

  private computePublicCancelTokenExpiry(sortedSessionStarts: Date[], durationMinutes: number): Date {
    if (sortedSessionStarts.length === 0) {
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    const safeDuration = Math.max(1, durationMinutes);
    const lastEndMs = Math.max(...sortedSessionStarts.map((s) => s.getTime() + safeDuration * 60_000));
    return new Date(lastEndMs + 24 * 60 * 60 * 1000);
  }

  private normalizeClientCancellationRefundPolicy(raw: string): "ALWAYS" | "HOURS_24" | "HOURS_48" {
    if (raw === "ALWAYS" || raw === "HOURS_24" || raw === "HOURS_48") {
      return raw;
    }
    return "HOURS_48";
  }

  private getNoticeThresholdMs(minNoticeHours: number) {
    const safeHours = Math.max(0, minNoticeHours);
    return Date.now() + safeHours * 60 * 60 * 1000;
  }

  private async resolveCoachBySlug(coachSlug: string) {
    const normalized = coachSlug.trim().toLowerCase();
    if (!normalized || RESERVED_PUBLIC_BOOKING_SLUGS.has(normalized)) {
      throw new TRPCError({ code: "NOT_FOUND", message: "COACH_NOT_FOUND" });
    }
    const row = await this.db.user.findFirst({
      where: { publicBookingSlug: normalized, archivedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        emailBookingNotificationsEnabled: true,
        publicBookingSitePublished: true,
        bio: true,
        address: true,
        publicBookingMinNoticeHours: true,
        clientCancellationRefundPolicy: true,
        stripeAccountId: true,
        stripeChargesEnabled: true,
        image: true,
        userAvatar: { select: { imageData: true } },
      },
    });
    if (row) {
      if (!row.publicBookingSitePublished) {
        throw new TRPCError({ code: "NOT_FOUND", message: "COACH_NOT_FOUND" });
      }
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        emailBookingNotificationsEnabled: row.emailBookingNotificationsEnabled,
        bio: row.bio,
        address: row.address,
        publicBookingMinNoticeHours: row.publicBookingMinNoticeHours,
        clientCancellationRefundPolicy: this.normalizeClientCancellationRefundPolicy(row.clientCancellationRefundPolicy),
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
        email: true,
        emailBookingNotificationsEnabled: true,
        publicBookingSitePublished: true,
        bio: true,
        address: true,
        publicBookingMinNoticeHours: true,
        clientCancellationRefundPolicy: true,
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
      throw new TRPCError({ code: "NOT_FOUND", message: "COACH_NOT_FOUND" });
    }
    const u = hits[0]!;
    if (!u.publicBookingSitePublished) {
      throw new TRPCError({ code: "NOT_FOUND", message: "COACH_NOT_FOUND" });
    }
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
          email: true,
          emailBookingNotificationsEnabled: true,
          publicBookingSitePublished: true,
          bio: true,
          address: true,
          publicBookingMinNoticeHours: true,
          clientCancellationRefundPolicy: true,
          stripeAccountId: true,
          stripeChargesEnabled: true,
          image: true,
          userAvatar: { select: { imageData: true } },
        },
      });
      if (raced) {
        if (!raced.publicBookingSitePublished) {
          throw new TRPCError({ code: "NOT_FOUND", message: "COACH_NOT_FOUND" });
        }
        return {
          id: raced.id,
          name: raced.name,
          email: raced.email,
          emailBookingNotificationsEnabled: raced.emailBookingNotificationsEnabled,
          bio: raced.bio,
          address: raced.address,
          publicBookingMinNoticeHours: raced.publicBookingMinNoticeHours,
          clientCancellationRefundPolicy: this.normalizeClientCancellationRefundPolicy(
            raced.clientCancellationRefundPolicy,
          ),
          stripeAccountId: raced.stripeAccountId,
          stripeChargesEnabled: raced.stripeChargesEnabled,
          image: resolveUserDisplayImage(raced),
        };
      }
      throw new TRPCError({ code: "NOT_FOUND", message: "COACH_NOT_FOUND" });
    }
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      emailBookingNotificationsEnabled: u.emailBookingNotificationsEnabled,
      bio: u.bio,
      address: u.address,
      publicBookingMinNoticeHours: u.publicBookingMinNoticeHours,
      clientCancellationRefundPolicy: this.normalizeClientCancellationRefundPolicy(u.clientCancellationRefundPolicy),
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
    coachReplyToEmail?: string | null;
    coachImageUrl?: string | null;
    serviceName: string;
    serviceDurationMinutes: number;
    servicePackSize: number;
    paidAmountEur: number;
    serviceAddress: string;
    serviceMapsUrl?: string | null;
    sessionsStartsAtIso: string[];
    clientCancelUrl?: string | null;
    clientCancellationRefundPolicy?: "ALWAYS" | "HOURS_24" | "HOURS_48";
    paidOnline?: boolean;
  }) {
    this.logger.log(
      `[booking-paid-confirmation] start to=${p.clientEmail} locale=${p.locale} service="${p.serviceName}" rawSessionsIso=${p.sessionsStartsAtIso.length} paidEur=${p.paidAmountEur}`,
    );

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
        startsAtIso: value.toISOString(),
      }));

    this.logger.log(
      `[booking-paid-confirmation] prepared sessions=${sessions.length} to=${p.clientEmail} (invalid ISO dates were dropped)`,
    );

    const sessionsIso = sessions.map((s) => s.startsAtIso);
    let icsContent: string | null = null;
    if (sessionsIso.length > 0) {
      const description =
        p.locale === "fr"
          ? `${p.serviceName} avec ${p.coachName} — ${sessions.length} séance(s) (Bookido).`
          : `${p.serviceName} with ${p.coachName} — ${sessions.length} session(s) (Bookido).`;
      const location = p.serviceAddress.trim().length > 0 ? p.serviceAddress.trim() : undefined;
      icsContent = buildBookingSessionsIcs({
        sessionsIso,
        durationMinutes: p.serviceDurationMinutes,
        summary: `${p.serviceName} — ${p.coachName}`,
        description,
        location,
      });
    }

    const subject =
      p.locale === "fr"
        ? "Réservation confirmée — récapitulatif de votre réservation"
        : "Booking confirmed — your booking summary";

    try {
      await sendEmail({
        to: p.clientEmail,
        replyTo: (p.coachReplyToEmail ?? "").trim().length > 0 ? (p.coachReplyToEmail ?? "").trim() : undefined,
        subject,
        fileAttachments:
          icsContent !== null
            ? [
                {
                  filename: "bookido-sessions.ics",
                  content: icsContent,
                  contentType: "text/calendar; charset=utf-8",
                },
              ]
            : undefined,
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
          clientCancelUrl: p.clientCancelUrl,
          clientCancellationRefundPolicy: p.clientCancellationRefundPolicy,
          paidOnline: p.paidOnline !== false,
          sessions,
        }),
      });
      this.logger.log(`[booking-paid-confirmation] sendEmail finished ok to=${p.clientEmail} subject="${subject}"`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `[booking-paid-confirmation] sendEmail failed to=${p.clientEmail} error=${message}${stack ? `\n${stack}` : ""}`,
      );
      throw err;
    }
  }

  private async sendProNewReservationEmail(p: {
    locale: "fr" | "en";
    proEmail: string;
    coachName: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    serviceName: string;
    serviceDurationMinutes: number;
    status: "pending" | "confirmed";
    sessionsStartsAt: Date[];
    isFree: boolean;
    isPaid: boolean;
    paidAmountEur?: number;
    listPriceEur?: number;
    paymentMethodLabel?: string;
    bookingId: string;
  }) {
    const frontendUrlRaw = process.env["FRONTEND_URL"]?.trim();
    if (!frontendUrlRaw) {
      this.logger.warn("sendProNewReservationEmail skipped: FRONTEND_URL_MISSING");
      return;
    }
    const frontendUrl = frontendUrlRaw.replace(/\/+$/g, "");
    const adminBookingUrl = `${frontendUrl}/admin/bookings/${encodeURIComponent(p.bookingId)}`;
    const dateLocale = p.locale === "fr" ? "fr-FR" : "en-US";
    const statusLabel =
      p.locale === "fr"
        ? p.status === "pending"
          ? "En attente de validation"
          : "Confirmée"
        : p.status === "pending"
          ? "Pending approval"
          : "Confirmed";
    const sessions = [...p.sessionsStartsAt]
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())
      .map((value) => ({
        whenLabel: new Intl.DateTimeFormat(dateLocale, {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(value),
      }));

    const amountLocale = p.locale === "fr" ? "fr-FR" : "en-US";
    const formatEur = (n: number) =>
      new Intl.NumberFormat(amountLocale, { style: "currency", currency: "EUR" }).format(n);
    const paidAmountLabel =
      p.isPaid && !p.isFree && p.paidAmountEur !== undefined ? formatEur(p.paidAmountEur) : null;
    const listPriceLabel = !p.isFree && p.listPriceEur !== undefined ? formatEur(p.listPriceEur) : null;

    await sendEmail({
      to: p.proEmail,
      subject: p.locale === "fr" ? "Nouvelle réservation — Bookido" : "New booking — Bookido",
      component: BookingProNewReservation({
        locale: p.locale,
        brandLogoSrc: emailBookidoLogoCidSrc(),
        coachName: p.coachName,
        clientName: p.clientName,
        clientEmail: p.clientEmail,
        clientPhone: p.clientPhone,
        serviceName: p.serviceName,
        serviceDurationMinutes: p.serviceDurationMinutes,
        statusLabel,
        adminBookingUrl,
        sessions,
        isFree: p.isFree,
        isPaid: p.isPaid,
        paidAmountLabel,
        listPriceLabel,
        paymentMethodLabel: p.paymentMethodLabel != null ? p.paymentMethodLabel : null,
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
      cancellationRefundPolicy: coach.clientCancellationRefundPolicy,
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
    options?: { markAsPaid?: boolean; paymentMethodLabel?: string; stripeCheckoutSessionId?: string | null },
  ) {
    const coach = await this.resolveCoachBySlug(input.coachSlug);
    const ownerUserId = coach.id;

    const service = await this.db.service.findFirst({
      where: { id: input.serviceId, userId: ownerUserId },
    });
    if (!service) {
      throw new TRPCError({ code: "NOT_FOUND", message: "SERVICE_NOT_FOUND" });
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

    const bookingPackGroupId = randomUUID();
    const stripeSessionForRows =
      markAsPaid && !service.isFree && (options?.stripeCheckoutSessionId?.trim().length ?? 0) > 0
        ? options!.stripeCheckoutSessionId!.trim()
        : null;

    const { lastRow, proEmailBookingId } = await this.db.$transaction(async (tx) => {
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

      let row: Awaited<ReturnType<BookingsService["create"]>> | null = null;
      let firstCreatedBookingId: string | null = null;
      for (let idx = 0; idx < sorted.length; idx += 1) {
        const startsAt = sorted[idx]!;
        // For multi-session packs, persist the full pack price on the first session
        // and keep the follow-up sessions at 0 to avoid splitting one purchase into many partial prices.
        const sessionCents = service.isFree ? 0 : idx === 0 ? totalPackCents : 0;
        const sessionPrice = sessionCents / 100;
        const sessionPaidAmount = markAsPaid ? sessionPrice : 0;
        row = await this.bookingsService.create(
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
          { tx, bookingPackGroupId, stripeCheckoutSessionId: stripeSessionForRows },
        );
        if (idx === 0) {
          firstCreatedBookingId = row.id;
        }
      }
      return { lastRow: row!, proEmailBookingId: firstCreatedBookingId ?? row!.id };
    });

    const notifyLocale = input.locale ?? "fr";
    if (coach.emailBookingNotificationsEnabled) {
      const proEmail = coach.email.trim();
      if (proEmail.length > 0) {
        try {
          const phoneForEmail =
            normalizedClientPhone.length > 0 && normalizedClientPhone !== "—" ? normalizedClientPhone : undefined;
          await this.sendProNewReservationEmail({
            locale: notifyLocale,
            proEmail,
            coachName: coach.name,
            clientName: normalizedClientName,
            clientEmail: email,
            clientPhone: phoneForEmail,
            serviceName: service.name,
            serviceDurationMinutes: service.durationMinutes,
            status,
            sessionsStartsAt: sorted,
            isFree: service.isFree,
            isPaid: markAsPaid,
            paidAmountEur: markAsPaid && !service.isFree ? totalPackCents / 100 : undefined,
            listPriceEur: !service.isFree ? service.price : undefined,
            paymentMethodLabel: markAsPaid ? paymentMethodLabel : undefined,
            bookingId: proEmailBookingId,
          });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          this.logger.warn(`sendProNewReservationEmail failed: ${message}`);
        }
      }
    }

    const shouldSendClientConfirmationEmail =
      markAsPaid || service.isFree || service.price <= 0;
    const clientPaidAmountEur =
      markAsPaid && !service.isFree ? totalPackCents / 100 : 0;

    if (shouldSendClientConfirmationEmail) {
      this.logger.log(
        `[booking-paid-confirmation] requestBooking send client confirmation clientEmail=${email} markAsPaid=${markAsPaid} isFree=${service.isFree} serviceId=${input.serviceId} packSize=${packSize}`,
      );
      const clientLocale = input.locale === "en" ? "en" : "fr";
      const bookingAddress = (service.address ?? coach.address ?? "").trim();
      const bookingMapsUrl =
        bookingAddress.length > 0
          ? `https://www.google.com/maps?q=${encodeURIComponent(bookingAddress)}`
          : null;
      let clientCancelUrl: string | null = null;
      const frontendUrlForPackCancel = process.env["FRONTEND_URL"]?.trim();
      if (frontendUrlForPackCancel) {
        const leadBooking = await this.db.booking.findFirst({
          where: { ownerId: ownerUserId, bookingPackGroupId, clientId: lastRow.clientId },
          orderBy: { startsAt: "asc" },
        });
        if (leadBooking) {
          const rawToken = randomBytes(32).toString("hex");
          const expiresAt = this.computePublicCancelTokenExpiry(sorted, service.durationMinutes);
          await this.db.booking.update({
            where: { id: leadBooking.id },
            data: { publicCancelToken: rawToken, publicCancelTokenExpiresAt: expiresAt },
          });
          clientCancelUrl = `${frontendUrlForPackCancel.replace(/\/+$/g, "")}/${encodeURIComponent(input.coachSlug)}/cancel?t=${encodeURIComponent(rawToken)}`;
        }
      }
      try {
        await this.sendPaidBookingConfirmationEmail({
          locale: clientLocale,
          clientEmail: email,
          clientName: normalizedClientName,
          coachName: coach.name,
          coachReplyToEmail: coach.email,
          coachImageUrl: coach.image,
          serviceName: service.name,
          serviceDurationMinutes: service.durationMinutes,
          servicePackSize: packSize,
          paidAmountEur: clientPaidAmountEur,
          serviceAddress: bookingAddress,
          serviceMapsUrl: bookingMapsUrl,
          sessionsStartsAtIso: sorted.map((d) => d.toISOString()),
          clientCancelUrl,
          clientCancellationRefundPolicy: coach.clientCancellationRefundPolicy,
          paidOnline: clientPaidAmountEur > 0,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        this.logger.error(
          `[booking-paid-confirmation] requestBooking catch after sendPaidBookingConfirmationEmail clientEmail=${email} error=${message}${stack ? `\n${stack}` : ""}`,
        );
      }
    } else {
      this.logger.log(
        `[booking-paid-confirmation] requestBooking skip client email (unpaid priced service) clientEmail=${email} serviceId=${input.serviceId}`,
      );
    }

    return lastRow;
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
      throw new TRPCError({ code: "NOT_FOUND", message: "SERVICE_NOT_FOUND" });
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
    const descPlain = plainTextFromHtml(service.description ?? "").trim();
    const serviceDescriptionParts = [
      `${service.durationMinutes} min`,
      `${servicePackSize} séance${servicePackSize > 1 ? "s" : ""}`,
      descPlain.length > 0 ? descPlain.slice(0, 450) : "",
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
    const emailFromMeta = (metadata["clientEmail"] ?? "").trim();
    const customerDetails = session.customer_details;
    const emailFromDetails =
      customerDetails && typeof customerDetails.email === "string" ? customerDetails.email.trim() : "";
    const emailFromLegacy =
      typeof session.customer_email === "string" ? session.customer_email.trim() : "";
    const clientEmail = (
      emailFromMeta.length > 0
        ? emailFromMeta
        : emailFromDetails.length > 0
          ? emailFromDetails
          : emailFromLegacy
    ).toLowerCase();
    const clientPhone = metadata["clientPhone"] ?? "";
    const localeRaw = metadata["locale"] ?? "fr";
    const locale: "fr" | "en" = localeRaw === "en" ? "en" : "fr";
    const bookingCreated = metadata["bookingCreated"] ?? "0";

    if (ownerUserId !== coach.id || coachSlug.toLowerCase() !== input.coachSlug.toLowerCase()) {
      throw new BadRequestException("CHECKOUT_MISMATCH");
    }
    if (bookingCreated === "1") {
      this.logger.log(
        `[booking-paid-confirmation] confirmCheckout skipped (metadata bookingCreated=1) sessionId=${input.sessionId} clientEmail=${clientEmail || "n/a"}`,
      );
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
        throw new TRPCError({ code: "NOT_FOUND", message: "BOOKING_NOT_FOUND" });
      }
      if (pendingBooking.status === "cancelled") {
        throw new BadRequestException("BOOKING_CANCELLED");
      }
      const paidAmount = Math.min(pendingBooking.price, Math.max(0, pendingBooking.price));
      const frontendUrlForCancel = process.env["FRONTEND_URL"]?.trim();
      const cancelToken = frontendUrlForCancel ? randomBytes(32).toString("hex") : null;
      const cancelTokenExpires = cancelToken
        ? this.computePublicCancelTokenExpiry([pendingBooking.startsAt], pendingBooking.durationMinutes)
        : null;
      await this.db.booking.update({
        where: { id: pendingBooking.id },
        data: {
          status: "confirmed",
          hostValidationAccepted: true,
          paidAmount,
          paymentMethod: "Stripe Checkout",
          stripeCheckoutSessionId: session.id,
          ...(cancelToken && cancelTokenExpires
            ? { publicCancelToken: cancelToken, publicCancelTokenExpiresAt: cancelTokenExpires }
            : {}),
        },
      });
      const clientCancelUrlPending =
        frontendUrlForCancel && cancelToken
          ? `${frontendUrlForCancel.replace(/\/+$/g, "")}/${encodeURIComponent(input.coachSlug)}/cancel?t=${encodeURIComponent(cancelToken)}`
          : null;
      const serviceMapsUrl =
        pendingBooking.service.address.trim().length > 0
          ? `https://www.google.com/maps?q=${encodeURIComponent(pendingBooking.service.address)}`
          : null;
      this.logger.log(
        `[booking-paid-confirmation] confirmCheckout pending_booking_confirmation clientEmail=${pendingBooking.client.email} bookingId=${pendingBookingId}`,
      );
      try {
        await this.sendPaidBookingConfirmationEmail({
          locale,
          clientEmail: pendingBooking.client.email,
          clientName: pendingBooking.client.name,
          coachName: coach.name,
          coachReplyToEmail: coach.email,
          coachImageUrl: coach.image,
          serviceName: pendingBooking.service.name,
          serviceDurationMinutes: pendingBooking.service.durationMinutes,
          servicePackSize: Math.max(1, pendingBooking.service.packSize),
          paidAmountEur: pendingBooking.price,
          serviceAddress: pendingBooking.service.address ?? "",
          serviceMapsUrl,
          sessionsStartsAtIso: [pendingBooking.startsAt.toISOString()],
          clientCancelUrl: clientCancelUrlPending,
          clientCancellationRefundPolicy: coach.clientCancellationRefundPolicy,
          paidOnline: pendingBooking.price > 0,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        this.logger.error(
          `[booking-paid-confirmation] pending flow send failed clientEmail=${pendingBooking.client.email} error=${message}${stack ? `\n${stack}` : ""}`,
        );
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

    this.logger.log(
      `[booking-paid-confirmation] confirmCheckout new_public_booking clientEmail=${clientEmail || "n/a"} metaEmailLen=${emailFromMeta.length} serviceId=${serviceId} sessionsJsonLen=${sessionsStartsAtJson.length}`,
    );

    if (clientEmail.length === 0) {
      throw new BadRequestException("CHECKOUT_CLIENT_EMAIL_MISSING");
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
          stripeCheckoutSessionId: session.id,
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

  async getCancelBookingPreview(input: { coachSlug: string; token: string }) {
    const coach = await this.resolveCoachBySlug(input.coachSlug);
    const token = input.token.trim();
    if (token.length < 32) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "CANCEL_TOKEN_INVALID" });
    }
    const lead = await this.db.booking.findFirst({
      where: {
        publicCancelToken: token,
        ownerId: coach.id,
        createdByClient: true,
      },
    });
    if (!lead) {
      throw new TRPCError({ code: "NOT_FOUND", message: "CANCEL_TOKEN_INVALID" });
    }
    if (lead.publicCancelTokenExpiresAt && lead.publicCancelTokenExpiresAt.getTime() < Date.now()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "CANCEL_TOKEN_EXPIRED" });
    }
    if (lead.status === "cancelled") {
      return {
        alreadyCancelled: true as const,
        clientCancellationRefundPolicy: "HOURS_48" as const,
        firstSessionStartsAt: lead.startsAt.toISOString(),
        refundTotalPaid: 0 as const,
        refundPolicyCutoffAt: null,
        hasOnlinePaidAmount: false as const,
        onlineRefundWillApply: false as const,
      };
    }
    const preview = await this.bookingsService.getClientSelfCancelRefundPreview(coach.id, lead.id);
    return { alreadyCancelled: false as const, ...preview };
  }

  async cancelBookingByToken(input: { coachSlug: string; token: string }) {
    const coach = await this.resolveCoachBySlug(input.coachSlug);
    const token = input.token.trim();
    if (token.length < 32) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "CANCEL_TOKEN_INVALID" });
    }
    const lead = await this.db.booking.findFirst({
      where: {
        publicCancelToken: token,
        ownerId: coach.id,
        createdByClient: true,
      },
    });
    if (!lead) {
      throw new TRPCError({ code: "NOT_FOUND", message: "CANCEL_TOKEN_INVALID" });
    }
    if (lead.publicCancelTokenExpiresAt && lead.publicCancelTokenExpiresAt.getTime() < Date.now()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "CANCEL_TOKEN_EXPIRED" });
    }
    if (lead.status === "cancelled") {
      return { ok: true as const, stripeRefunded: false as const, alreadyCancelled: true as const };
    }
    try {
      const result = await this.bookingsService.cancelWithRefund(coach.id, { id: lead.id, refundStripe: true });
      return { ok: true as const, stripeRefunded: result.stripeRefunded, alreadyCancelled: false as const };
    } catch (e) {
      if (e instanceof BadRequestException && String(e.message).includes("BOOKING_REFUND_OUTSIDE_POLICY_WINDOW")) {
        const result = await this.bookingsService.cancelWithRefund(coach.id, { id: lead.id, refundStripe: false });
        return { ok: true as const, stripeRefunded: result.stripeRefunded, alreadyCancelled: false as const };
      }
      throw e;
    }
  }
}
