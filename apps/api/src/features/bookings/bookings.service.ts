import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@api/generated/prisma/client";

import { PrismaService } from "@api/src/infrastructure/prisma/prisma.service";

import type { CreateBookingInput, UpdateBookingInput } from "./bookings.schema";

const bookingInclude = { client: true, service: true } as const;

type BookingWithRelations = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

@Injectable()
export class BookingsService {
  constructor(private readonly db: PrismaService) {}

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

  async getById(ownerId: string, id: string) {
    const row = await this.db.booking.findFirst({
      where: { id, ownerId },
      include: bookingInclude,
    });
    if (!row) {
      throw new NotFoundException("Booking not found");
    }
    return this.mapRow(row);
  }

  async create(ownerId: string, input: CreateBookingInput) {
    const client = await this.db.client.findFirst({
      where: { id: input.clientId, ownerId },
    });
    if (!client) {
      throw new NotFoundException("Client not found");
    }
    const service = await this.db.service.findFirst({
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

    const row = await this.db.booking.create({
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
      },
      include: bookingInclude,
    });
    return this.mapRow(row);
  }

  async countUnseenClientBookings(ownerId: string) {
    const user = await this.db.user.findUnique({
      where: { id: ownerId },
      select: { bookingsLastViewedAt: true },
    });
    const since = user?.bookingsLastViewedAt ?? new Date(0);
    return this.db.booking.count({
      where: {
        ownerId,
        createdByClient: true,
        createdAt: { gt: since },
        status: { not: "cancelled" },
      },
    });
  }

  async markBookingsListViewed(ownerId: string) {
    await this.db.user.update({
      where: { id: ownerId },
      data: { bookingsLastViewedAt: new Date() },
    });
    return { ok: true as const };
  }

  async update(ownerId: string, id: string, data: UpdateBookingInput) {
    const existing = await this.db.booking.findFirst({
      where: { id, ownerId },
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
        ...(data.notes !== undefined && { notes: data.notes.length ? data.notes : null }),
        ...(data.startsAt !== undefined && { startsAt: new Date(data.startsAt) }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.hostValidationAccepted !== undefined && { hostValidationAccepted: data.hostValidationAccepted }),
        ...(data.paidAmount !== undefined && { paidAmount: nextPaid }),
      },
      include: bookingInclude,
    });
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
