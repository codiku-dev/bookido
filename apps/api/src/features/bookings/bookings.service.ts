import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@api/generated/prisma/client";
import { BookingPaymentRequired, emailBookidoLogoCidSrc } from "@repo/emails";

import { PrismaService } from "@api/src/infrastructure/prisma/prisma.service";
import { StripeService } from "@api/src/features/stripe/stripe.service";
import { sendEmail } from "@api/src/libs/email-libs";

import type { CancelBookingWithRefundInput, CreateBookingInput, UpdateBookingInput } from "./bookings.schema";
import type { ListBookingsPaginatedInput } from "./bookings.schema";

const bookingInclude = { client: true, service: true } as const;

type BookingWithRelations = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

@Injectable()
export class BookingsService {
  constructor(
    private readonly db: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  private applicationFeeAmountFromTotalCents(totalCents: number) {
    const raw = Math.round((totalCents * 150) / 10_000);
    if (totalCents <= 0) {
      return 0;
    }
    return Math.max(1, raw);
  }

  private async sendPendingBookingPaymentRequiredEmail(p: {
    clientEmail: string;
    clientName: string;
    serviceName: string;
    payNowUrl: string;
    locale: "fr" | "en";
  }) {
    await sendEmail({
      to: p.clientEmail,
      subject: p.locale === "fr" ? "Il ne manque que votre paiement" : "Only your payment is missing",
      component: BookingPaymentRequired({
        locale: p.locale,
        brandLogoSrc: emailBookidoLogoCidSrc(),
        clientName: p.clientName,
        serviceName: p.serviceName,
        payNowUrl: p.payNowUrl,
      }),
    });
  }

  private mapRow(row: BookingWithRelations) {
    return {
      id: row.id,
      ownerId: row.ownerId,
      clientId: row.clientId,
      serviceId: row.serviceId,
      startsAt: row.startsAt,
      durationMinutes: row.durationMinutes,
      price: row.price,
      paidAmount: row.paidAmount,
      status: row.status as "confirmed" | "pending" | "cancelled",
      notes: row.notes,
      location: row.location,
      paymentMethod: row.paymentMethod,
      requiresHostValidation: row.requiresHostValidation,
      hostValidationAccepted: row.hostValidationAccepted,
      createdByClient: row.createdByClient,
      isUnseenInAdmin: row.createdByClient && row.adminViewedAt === null && row.status !== "cancelled",
      bookingPackGroupId: row.bookingPackGroupId,
      stripeCheckoutSessionId: row.stripeCheckoutSessionId,
      stripeRefundedAt: row.stripeRefundedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      clientName: row.client.name,
      clientEmail: row.client.email,
      clientPhone: row.client.phone,
      serviceName: row.service.name,
      allowsDirectPayment: row.service.allowsDirectPayment,
    };
  }

  async list(ownerId: string, input?: { rangeFrom?: string; rangeTo?: string }) {
    const where: Prisma.BookingWhereInput = { ownerId };
    const startsAt: Prisma.DateTimeFilter = {};
    if (input?.rangeFrom) {
      startsAt.gte = new Date(input.rangeFrom);
    }
    if (input?.rangeTo) {
      startsAt.lte = new Date(input.rangeTo);
    }
    if (Object.keys(startsAt).length > 0) {
      where.startsAt = startsAt;
    }
    const rows = await this.db.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { startsAt: "asc" },
    });
    return rows.map((r) => this.mapRow(r));
  }

  async listPaginated(ownerId: string, input: ListBookingsPaginatedInput) {
    const page = input.page;
    const pageSize = input.pageSize;
    const search = input.search?.trim() ?? "";

    const where: Prisma.BookingWhereInput = {
      ownerId,
      ...(input.status ? { status: input.status } : {}),
      ...(input.dateFrom || input.dateTo
        ? {
            startsAt: {
              ...(input.dateFrom ? { gte: new Date(`${input.dateFrom}T00:00:00.000Z`) } : {}),
              ...(input.dateTo ? { lte: new Date(`${input.dateTo}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
      ...(search.length > 0
        ? {
            OR: [
              { client: { name: { contains: search, mode: "insensitive" } } },
              { client: { email: { contains: search, mode: "insensitive" } } },
              { client: { phone: { contains: search, mode: "insensitive" } } },
              { service: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(input.payment === "paid"
        ? { paidAmount: { gte: 0.00001 } }
        : input.payment === "unpaid"
          ? { paidAmount: 0 }
          : {}),
    };

    const [total, rows] = await Promise.all([
      this.db.booking.count({ where }),
      this.db.booking.findMany({
        where,
        include: bookingInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const mappedRows = rows.map((r) => this.mapRow(r));
    const paymentFiltered =
      input.payment === "partial"
        ? mappedRows.filter((row) => row.paidAmount > 0 && row.paidAmount < row.price)
        : mappedRows;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return {
      items: paymentFiltered,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getById(ownerId: string, id: string) {
    const row = await this.db.booking.findFirst({
      where: { id, ownerId },
      include: bookingInclude,
    });
    if (!row) {
      throw new NotFoundException("Booking not found");
    }
    return {
      ...this.mapRow(row),
      serviceDescription: row.service.description ?? "",
    };
  }

  async create(
    ownerId: string,
    input: CreateBookingInput,
    options?: {
      tx?: Prisma.TransactionClient;
      stripeCheckoutSessionId?: string | null;
      bookingPackGroupId?: string | null;
    },
  ) {
    const db = options?.tx ?? this.db;
    const client = await db.client.findFirst({
      where: { id: input.clientId, ownerId },
    });
    if (!client) {
      throw new NotFoundException("Client not found");
    }
    const service = await db.service.findFirst({
      where: { id: input.serviceId, userId: ownerId },
    });
    if (!service) {
      throw new NotFoundException("Service not found");
    }
    const startsAt = new Date(input.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException("Invalid startsAt");
    }
    const durationMinutes = input.durationMinutes ?? service.durationMinutes;
    const price = input.price ?? (service.isFree ? 0 : service.price);
    const paidRaw = input.paidAmount ?? 0;
    const paidAmount = Math.min(price, Math.max(0, paidRaw));

    const row = await db.booking.create({
      data: {
        ownerId,
        clientId: input.clientId,
        serviceId: input.serviceId,
        startsAt,
        durationMinutes,
        price,
        paidAmount,
        status: input.status,
        notes: input.notes?.length ? input.notes : null,
        location: input.location?.length ? input.location : "",
        paymentMethod: input.paymentMethod?.length ? input.paymentMethod : "—",
        requiresHostValidation: service.requiresValidation,
        hostValidationAccepted: !service.requiresValidation,
        createdByClient: input.createdByClient ?? false,
        bookingPackGroupId: options?.bookingPackGroupId ?? null,
        stripeCheckoutSessionId: options?.stripeCheckoutSessionId ?? null,
      },
      include: bookingInclude,
    });
    return this.mapRow(row);
  }

  private parseOwnerRefundPolicy(raw: string): "ALWAYS" | "HOURS_24" | "HOURS_48" {
    if (raw === "ALWAYS" || raw === "HOURS_24" || raw === "HOURS_48") {
      return raw;
    }
    return "HOURS_48";
  }

  private refundPolicyMinHoursBeforeStart(policy: "ALWAYS" | "HOURS_24" | "HOURS_48"): number | null {
    if (policy === "ALWAYS") {
      return null;
    }
    if (policy === "HOURS_24") {
      return 24;
    }
    return 48;
  }

  private async loadPackForBooking(ownerId: string, bookingId: string): Promise<BookingWithRelations[]> {
    const booking = await this.db.booking.findFirst({
      where: { id: bookingId, ownerId },
      include: bookingInclude,
    });
    if (!booking) {
      throw new NotFoundException("Booking not found");
    }
    const groupId = booking.bookingPackGroupId?.trim();
    if (!groupId) {
      return [booking];
    }
    return this.db.booking.findMany({
      where: { ownerId, bookingPackGroupId: groupId },
      include: bookingInclude,
      orderBy: { startsAt: "asc" },
    });
  }

  /**
   * Whether an online Stripe refund would succeed if the client cancels now (same window as {@link cancelWithRefund} with refundStripe: true).
   */
  async getClientSelfCancelRefundPreview(ownerId: string, leadBookingId: string) {
    const pack = await this.loadPackForBooking(ownerId, leadBookingId);
    const owner = await this.db.user.findUnique({
      where: { id: ownerId },
      select: { clientCancellationRefundPolicy: true, stripeAccountId: true },
    });
    if (!owner) {
      throw new NotFoundException("Booking not found");
    }

    const active = pack.filter((b) => b.status !== "cancelled");
    if (active.length === 0) {
      throw new BadRequestException("BOOKING_ALREADY_CANCELLED");
    }

    const minStart = active.reduce(
      (min, b) => (b.startsAt.getTime() < min.getTime() ? b.startsAt : min),
      active[0]!.startsAt,
    );
    const policy = this.parseOwnerRefundPolicy(owner.clientCancellationRefundPolicy);
    const minHours = this.refundPolicyMinHoursBeforeStart(policy);
    const msBefore = minStart.getTime() - Date.now();
    const withinPolicy = minHours === null || msBefore >= minHours * 60 * 60 * 1000;

    const totalPaid = active.reduce((s, b) => s + b.paidAmount, 0);
    const totalPaidCents = Math.round(totalPaid * 100);
    const sessionId =
      active.find((b) => (b.stripeCheckoutSessionId ?? "").trim().length > 0)?.stripeCheckoutSessionId?.trim() ?? "";
    const hasOnlinePaidAmount = totalPaidCents > 0;
    const hasStripePipeline = sessionId.length > 0 && (owner.stripeAccountId ?? "").trim().length > 0;
    const anyRefunded = active.some((b) => b.stripeRefundedAt !== null);

    const onlineRefundWillApply = hasOnlinePaidAmount && hasStripePipeline && !anyRefunded && withinPolicy;

    const refundPolicyCutoffAt =
      minHours === null ? null : new Date(minStart.getTime() - minHours * 60 * 60 * 1000).toISOString();

    return {
      clientCancellationRefundPolicy: policy,
      firstSessionStartsAt: minStart.toISOString(),
      refundTotalPaid: totalPaid,
      refundPolicyCutoffAt,
      hasOnlinePaidAmount,
      onlineRefundWillApply,
    };
  }

  async cancelWithRefund(ownerId: string, input: CancelBookingWithRefundInput) {
    if (!input.refundStripe) {
      const pack = await this.loadPackForBooking(ownerId, input.id);
      const activeIds = pack.filter((b) => b.status !== "cancelled").map((b) => b.id);
      if (activeIds.length === 0) {
        throw new BadRequestException("BOOKING_ALREADY_CANCELLED");
      }
      await this.db.booking.updateMany({
        where: { id: { in: activeIds } },
        data: {
          status: "cancelled",
          publicCancelToken: null,
          publicCancelTokenExpiresAt: null,
        },
      });
      return { ok: true as const, cancelledBookingIds: activeIds, stripeRefunded: false as const };
    }

    const pack = await this.loadPackForBooking(ownerId, input.id);
    const owner = await this.db.user.findUnique({
      where: { id: ownerId },
      select: { stripeAccountId: true, clientCancellationRefundPolicy: true },
    });
    if (!owner) {
      throw new NotFoundException("Booking not found");
    }

    const active = pack.filter((b) => b.status !== "cancelled");
    if (active.length === 0) {
      throw new BadRequestException("BOOKING_ALREADY_CANCELLED");
    }

    const minStart = active.reduce((min, b) => (b.startsAt.getTime() < min.getTime() ? b.startsAt : min), active[0]!.startsAt);
    const policy = this.parseOwnerRefundPolicy(owner.clientCancellationRefundPolicy);
    const minHours = this.refundPolicyMinHoursBeforeStart(policy);
    if (minHours !== null) {
      const msBefore = minStart.getTime() - Date.now();
      if (msBefore < minHours * 60 * 60 * 1000) {
        throw new BadRequestException("BOOKING_REFUND_OUTSIDE_POLICY_WINDOW");
      }
    }

    const sessionId = active.find((b) => (b.stripeCheckoutSessionId ?? "").trim().length > 0)?.stripeCheckoutSessionId?.trim();
    const totalPaid = active.reduce((s, b) => s + b.paidAmount, 0);
    const totalPaidCents = Math.round(totalPaid * 100);

    if (totalPaidCents <= 0) {
      await this.db.booking.updateMany({
        where: { id: { in: active.map((b) => b.id) } },
        data: {
          status: "cancelled",
          paidAmount: 0,
          publicCancelToken: null,
          publicCancelTokenExpiresAt: null,
        },
      });
      return { ok: true as const, cancelledBookingIds: active.map((b) => b.id), stripeRefunded: false as const };
    }

    if (!sessionId || !owner.stripeAccountId?.trim()) {
      throw new BadRequestException("BOOKING_REFUND_NO_STRIPE_SESSION");
    }

    if (active.some((b) => b.stripeRefundedAt !== null)) {
      throw new BadRequestException("BOOKING_ALREADY_REFUNDED");
    }

    const stripe = this.stripeService.getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(
      sessionId,
      { expand: ["payment_intent"] },
      { stripeAccount: owner.stripeAccountId.trim() },
    );
    const piRaw = session.payment_intent;
    const piId = typeof piRaw === "string" ? piRaw : piRaw && typeof piRaw === "object" && "id" in piRaw ? String(piRaw.id) : "";
    if (!piId) {
      throw new BadRequestException("BOOKING_REFUND_NO_PAYMENT_INTENT");
    }

    try {
      await stripe.refunds.create({ payment_intent: piId }, { stripeAccount: owner.stripeAccountId.trim() });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(`BOOKING_STRIPE_REFUND_FAILED:${msg}`);
    }

    const now = new Date();
    await this.db.booking.updateMany({
      where: { id: { in: active.map((b) => b.id) } },
      data: {
        status: "cancelled",
        paidAmount: 0,
        stripeRefundedAt: now,
        publicCancelToken: null,
        publicCancelTokenExpiresAt: null,
      },
    });

    return { ok: true as const, cancelledBookingIds: active.map((b) => b.id), stripeRefunded: true as const };
  }

  async countUnseenClientBookings(ownerId: string) {
    const unseenRows = await this.db.booking.findMany({
      where: {
        ownerId,
        createdByClient: true,
        adminViewedAt: null,
        status: { not: "cancelled" },
      },
      select: {
        ownerId: true,
        clientId: true,
        serviceId: true,
        createdAt: true,
      },
    });

    const groupedReservationKeys = new Set<string>();
    for (const booking of unseenRows) {
      // Keep badge count aligned with list grouping for pack reservations.
      const createdAtSecond = Math.floor(booking.createdAt.getTime() / 1000);
      groupedReservationKeys.add(`${booking.ownerId}|${booking.clientId}|${booking.serviceId}|${createdAtSecond}`);
    }
    return groupedReservationKeys.size;
  }

  async markBookingsListViewed(ownerId: string) {
    await this.db.booking.updateMany({
      where: {
        ownerId,
        createdByClient: true,
        adminViewedAt: null,
      },
      data: { adminViewedAt: new Date() },
    });
    return { ok: true as const };
  }

  async markBookingViewed(ownerId: string, id: string) {
    await this.db.booking.updateMany({
      where: {
        id,
        ownerId,
        createdByClient: true,
        adminViewedAt: null,
      },
      data: { adminViewedAt: new Date() },
    });
    return { ok: true as const };
  }

  async update(ownerId: string, id: string, data: UpdateBookingInput) {
    const existing = await this.db.booking.findFirst({
      where: { id, ownerId },
      include: {
        client: true,
        service: true,
        owner: {
          select: {
            publicBookingSlug: true,
            stripeAccountId: true,
            stripeChargesEnabled: true,
          },
        },
      },
    });
    if (!existing) {
      throw new NotFoundException("Booking not found");
    }
    const nextPaid =
      data.paidAmount !== undefined
        ? Math.min(existing.price, Math.max(0, data.paidAmount))
        : existing.paidAmount;

    const row = await this.db.booking.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.status === "cancelled" && {
          publicCancelToken: null,
          publicCancelTokenExpiresAt: null,
        }),
        ...(data.notes !== undefined && { notes: data.notes.length ? data.notes : null }),
        ...(data.startsAt !== undefined && { startsAt: new Date(data.startsAt) }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.hostValidationAccepted !== undefined && { hostValidationAccepted: data.hostValidationAccepted }),
        ...(data.paidAmount !== undefined && { paidAmount: nextPaid }),
      },
      include: bookingInclude,
    });
    const shouldSendPaymentEmail =
      existing.requiresHostValidation &&
      existing.hostValidationAccepted === false &&
      existing.status === "pending" &&
      data.hostValidationAccepted === true &&
      data.status === "confirmed" &&
      existing.price > 0 &&
      existing.paidAmount < existing.price;

    if (shouldSendPaymentEmail) {
      const coachSlug = existing.owner.publicBookingSlug?.trim();
      const stripeAccountId = existing.owner.stripeAccountId?.trim();
      if (coachSlug && stripeAccountId && existing.owner.stripeChargesEnabled) {
        const frontendUrlRaw = process.env["FRONTEND_URL"]?.trim();
        if (frontendUrlRaw) {
          const frontendUrl = frontendUrlRaw.replace(/\/+$/g, "");
          const bookingPageBase = `${frontendUrl}/${encodeURIComponent(coachSlug)}/booking`;
          const successUrl = `${bookingPageBase}?service=${encodeURIComponent(existing.serviceId)}&checkout=success&session_id={CHECKOUT_SESSION_ID}`;
          const cancelUrl = `${bookingPageBase}?service=${encodeURIComponent(existing.serviceId)}&checkout=cancel`;
          const totalCents = Math.round(existing.price * 100);
          const applicationFeeAmount = this.applicationFeeAmountFromTotalCents(totalCents);
          const stripe = this.stripeService.getStripeClient();
          const stripeProductDescription = [
            `${existing.durationMinutes} min`,
            `${Math.max(1, existing.service.packSize)} session${Math.max(1, existing.service.packSize) > 1 ? "s" : ""}`,
            existing.service.description?.trim() ?? "",
          ]
            .filter((part) => part.length > 0)
            .join(" • ");
          const stripeProductImages =
            existing.service.imageUrl && /^https?:\/\//i.test(existing.service.imageUrl)
              ? [existing.service.imageUrl]
              : undefined;
          const session = await stripe.checkout.sessions.create(
            {
              mode: "payment",
              customer_email: existing.client.email,
              line_items: [
                {
                  price_data: {
                    currency: "eur",
                    product_data: {
                      name: existing.service.name,
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
                paymentFlow: "pending_booking_confirmation",
                bookingId: existing.id,
                ownerUserId: existing.ownerId,
                coachSlug,
                serviceId: existing.serviceId,
                sessionsStartsAtJson: JSON.stringify([existing.startsAt.toISOString()]),
                clientName: existing.client.name,
                clientEmail: existing.client.email,
                clientPhone: existing.client.phone,
                locale: "fr",
                bookingCreated: "0",
              },
            },
            {
              stripeAccount: stripeAccountId,
            },
          );
          if (session.url) {
            try {
              await this.sendPendingBookingPaymentRequiredEmail({
                clientEmail: existing.client.email,
                clientName: existing.client.name,
                serviceName: existing.service.name,
                payNowUrl: session.url,
                locale: "fr",
              });
            } catch {
              // Keep booking update resilient if email provider is unavailable.
            }
          }
        }
      }
    }
    return this.mapRow(row);
  }

  async remove(ownerId: string, id: string) {
    const existing = await this.db.booking.findFirst({
      where: { id, ownerId },
    });
    if (!existing) {
      throw new NotFoundException("Booking not found");
    }
    await this.db.booking.delete({ where: { id } });
    return { id };
  }
}
