import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import { RESERVED_PUBLIC_BOOKING_SLUGS } from "@api/src/common/reserved-public-booking-slugs";
import { PrismaService } from "@api/src/infrastructure/prisma/prisma.service";
import { BookingsService } from "@api/src/features/bookings/bookings.service";
import { ProfileService, resolveUserDisplayImage } from "@api/src/features/profile/profile.service";
import { ServicesService } from "@api/src/features/services/services.service";

import type { PublicBookingRequestInput } from "./public-booking.schema";

@Injectable()
export class PublicBookingService {
  constructor(
    private readonly db: PrismaService,
    private readonly profileService: ProfileService,
    private readonly servicesService: ServicesService,
    private readonly bookingsService: BookingsService,
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
      image: resolveUserDisplayImage(u),
    };
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

  async requestBooking(input: PublicBookingRequestInput) {
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

    const status = service.requiresValidation ? ("pending" as const) : ("confirmed" as const);
    const sorted = [...parsed].sort((a, b) => a.getTime() - b.getTime());
    const unitCents = service.isFree ? 0 : Math.round(service.price * 100);
    const baseCents = packSize > 0 ? Math.floor(unitCents / packSize) : 0;
    let allocatedCents = 0;

    return this.db.$transaction(async (tx) => {
      let client = await tx.client.findFirst({
        where: { ownerId: ownerUserId, email },
      });
      if (!client) {
        const phone = (input.clientPhone ?? "").trim();
        client = await tx.client.create({
          data: {
            ownerId: ownerUserId,
            name: input.clientName.trim(),
            email,
            phone: phone.length > 0 ? phone : "—",
          },
        });
      }

      let lastRow: Awaited<ReturnType<BookingsService["create"]>> | null = null;
      for (let idx = 0; idx < sorted.length; idx += 1) {
        const startsAt = sorted[idx]!;
        const isLast = idx === sorted.length - 1;
        const sessionCents = service.isFree ? 0 : isLast ? unitCents - allocatedCents : baseCents;
        if (!service.isFree) {
          allocatedCents += sessionCents;
        }
        const sessionPrice = sessionCents / 100;
        lastRow = await this.bookingsService.create(
          ownerUserId,
          {
            clientId: client.id,
            serviceId: service.id,
            startsAt: startsAt.toISOString(),
            durationMinutes: service.durationMinutes,
            price: sessionPrice,
            paidAmount: 0,
            status,
            notes: undefined,
            location: service.address ?? coach.address ?? "",
            paymentMethod: "—",
            createdByClient: true,
          },
          { tx },
        );
      }
      return lastRow!;
    });
  }
}
