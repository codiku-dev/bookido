import { Injectable } from "@nestjs/common";
import { TRPCError } from "@trpc/server";
import { verifyPassword } from "better-auth/crypto";
import { Prisma } from "@api/generated/prisma/client";

import {
  DEFAULT_USER_CALENDAR_WEEK_HOURS,
  buildDefaultLunchClosedSlotKeys,
} from "@api/src/common/default-calendar-availability";
import { RESERVED_PUBLIC_BOOKING_SLUGS } from "@api/src/common/reserved-public-booking-slugs";
import { PrismaService } from "@api/src/infrastructure/prisma/prisma.service";
import { StripeService } from "@api/src/features/stripe/stripe.service";

import type {
  UpdateProfileAvatarInput,
  UpdateProfileBasicsInput,
  UpdatePublicBookingPresenceInput,
  WeekHoursInput,
} from "./profile.schema";

const DEFAULT_WEEK_HOURS: WeekHoursInput = { ...DEFAULT_USER_CALENDAR_WEEK_HOURS };

const PUBLIC_BOOKING_SLUG_MAX_LEN = 96;
const PUBLIC_BOOKING_SLUG_MIN_LEN = 2;

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** `Jean De La Fontaine` → `jean-de-la-fontaine` (valid `publicBookingSlug` when possible). */
function slugifyFullNameToPublicBookingBase(fullName: string): string | null {
  const segments = fullName
    .trim()
    .split(/\s+/)
    .map((part) =>
      stripDiacritics(part)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ""),
    )
    .filter((s) => s.length > 0);
  if (segments.length === 0) {
    return null;
  }
  let joined = segments.join("-");
  if (joined.length > PUBLIC_BOOKING_SLUG_MAX_LEN) {
    joined = joined.slice(0, PUBLIC_BOOKING_SLUG_MAX_LEN).replace(/-+$/g, "");
  }
  if (joined.length < PUBLIC_BOOKING_SLUG_MIN_LEN) {
    return null;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(joined)) {
    return null;
  }
  return joined;
}

function fallbackPublicBookingSlugBase(userId: string): string {
  const compact = userId.replace(/-/g, "").toLowerCase();
  const tail = compact.slice(-12);
  return `coach-${tail}`;
}

function parseWeekHours(value: Prisma.JsonValue | null | undefined): WeekHoursInput {
  if (value === null || value === undefined) {
    return { ...DEFAULT_WEEK_HOURS };
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_WEEK_HOURS };
  }
  const raw = value as Record<string, unknown>;
  const merged: WeekHoursInput = { ...DEFAULT_WEEK_HOURS };
  for (const day of Object.keys(DEFAULT_WEEK_HOURS) as (keyof WeekHoursInput)[]) {
    const entry = raw[day];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }
    const o = entry as Record<string, unknown>;
    merged[day] = {
      enabled: typeof o["enabled"] === "boolean" ? o["enabled"] : merged[day].enabled,
      startTime: typeof o["startTime"] === "string" ? o["startTime"] : merged[day].startTime,
      endTime: typeof o["endTime"] === "string" ? o["endTime"] : merged[day].endTime,
    };
  }
  return merged;
}

export function resolveUserDisplayImage(row: {
  image: string | null;
  userAvatar: { imageData: string | null } | null;
}): string | null {
  const fromAvatar = row.userAvatar?.imageData?.trim();
  if (fromAvatar && fromAvatar.length > 0) {
    return fromAvatar;
  }
  const fromUser = row.image?.trim();
  return fromUser && fromUser.length > 0 ? fromUser : null;
}

function parseClosedSlotKeys(value: Prisma.JsonValue | null | undefined): string[] {
  if (value === null || value === undefined) {
    return buildDefaultLunchClosedSlotKeys();
  }
  if (!Array.isArray(value)) {
    return buildDefaultLunchClosedSlotKeys();
  }
  return value.filter((item): item is string => typeof item === "string");
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly db: PrismaService,
    private readonly stripeService: StripeService,
  ) { }

  private async isPublicBookingSlugTakenByOtherUser(p: { slug: string; userId: string }): Promise<boolean> {
    const row = await this.db.user.findFirst({
      where: {
        publicBookingSlug: p.slug,
        id: { not: p.userId },
      },
      select: { id: true },
    });
    return row !== null;
  }

  /** First slug attempt (`-1`, `-2` suffixes applied only in allocation loop). */
  private buildNthSlugCandidate(p: { userId: string; name: string; n: number }): string | null {
    const preferred = slugifyFullNameToPublicBookingBase(p.name) ?? fallbackPublicBookingSlugBase(p.userId);
    const suffix = p.n === 0 ? "" : `-${p.n}`;
    const roomForBase = PUBLIC_BOOKING_SLUG_MAX_LEN - suffix.length;
    if (roomForBase < PUBLIC_BOOKING_SLUG_MIN_LEN) {
      return null;
    }
    let base = preferred;
    if (base.length > roomForBase) {
      base = base.slice(0, roomForBase).replace(/-+$/g, "");
    }
    if (base.length < PUBLIC_BOOKING_SLUG_MIN_LEN) {
      base = fallbackPublicBookingSlugBase(p.userId)
        .slice(0, roomForBase)
        .replace(/-+$/g, "");
    }
    if (base.length < PUBLIC_BOOKING_SLUG_MIN_LEN) {
      base = "co";
    }
    const candidate = `${base}${suffix}`;
    if (candidate.length < PUBLIC_BOOKING_SLUG_MIN_LEN || candidate.length > PUBLIC_BOOKING_SLUG_MAX_LEN) {
      return null;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate)) {
      return null;
    }
    return candidate;
  }

  /** Default public URL slug for a user (before uniqueness suffixes). Used for storefront backfill. */
  initialPublicBookingSlugCandidate(userId: string, name: string): string {
    return this.buildNthSlugCandidate({ userId, name, n: 0 }) ?? fallbackPublicBookingSlugBase(userId);
  }

  private async allocateUniquePublicBookingSlugFromName(p: { userId: string; name: string }): Promise<string> {
    const maxAttempts = 1_000;
    for (let n = 0; n < maxAttempts; n += 1) {
      const candidate = this.buildNthSlugCandidate({ userId: p.userId, name: p.name, n });
      if (!candidate) {
        continue;
      }
      if (RESERVED_PUBLIC_BOOKING_SLUGS.has(candidate)) {
        continue;
      }
      const taken = await this.isPublicBookingSlugTakenByOtherUser({ slug: candidate, userId: p.userId });
      if (!taken) {
        return candidate;
      }
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "PUBLIC_BOOKING_SLUG_ALLOCATION_EXHAUSTED",
    });
  }

  async getCalendarAvailability(userId: string) {
    const row = await this.db.user.findUnique({
      where: { id: userId },
      select: { calendarWeekHours: true, calendarClosedSlotKeys: true },
    });
    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "USER_NOT_FOUND" });
    }
    return {
      weekHours: parseWeekHours(row.calendarWeekHours),
      closedSlotKeys: parseClosedSlotKeys(row.calendarClosedSlotKeys),
    };
  }

  async getPublicBookingPresence(userId: string) {
    const row = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        publicBookingSlug: true,
        image: true,
        name: true,
        address: true,
        publicBookingMinNoticeHours: true,
        userAvatar: { select: { imageData: true } },
      },
    });
    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "USER_NOT_FOUND" });
    }
    const displayImage = resolveUserDisplayImage(row);
    const existing = (row.publicBookingSlug ?? "").trim();
    if (existing.length > 0) {
      return {
        publicBookingSlug: row.publicBookingSlug,
        image: displayImage,
        defaultAddress: row.address,
        publicBookingMinNoticeHours: row.publicBookingMinNoticeHours,
      };
    }
    const maxPersistAttempts = 5;
    for (let attempt = 0; attempt < maxPersistAttempts; attempt += 1) {
      const allocated = await this.allocateUniquePublicBookingSlugFromName({ userId, name: row.name });
      try {
        await this.db.user.update({
          where: { id: userId },
          data: { publicBookingSlug: allocated },
        });
        return {
          publicBookingSlug: allocated,
          image: displayImage,
          defaultAddress: row.address,
          publicBookingMinNoticeHours: row.publicBookingMinNoticeHours,
        };
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          continue;
        }
        throw e;
      }
    }
    throw new TRPCError({
      code: "CONFLICT",
      message: "PUBLIC_BOOKING_SLUG_PERSIST_FAILED",
    });
  }

  async getStripeConnectStatus(userId: string) {
    return this.stripeService.getConnectStatus(userId);
  }

  async getPlatformBillingHistory(userId: string) {
    return this.stripeService.getPlatformBillingHistory(userId);
  }

  async createStripeOnboardingLink(userId: string) {
    return this.stripeService.createOrRefreshOnboardingLink({ userId });
  }

  async createStripeConnectAccountUpdateLink(userId: string) {
    return this.stripeService.createConnectAccountUpdateLink({ userId });
  }

  async createStripeEmbeddedAccountSession(userId: string) {
    return this.stripeService.createEmbeddedAccountSession({ userId });
  }

  async updateProfileAvatar(userId: string, input: UpdateProfileAvatarInput) {
    const raw = input.image;
    const clear = raw === null || raw === "" || raw.trim().length === 0;
    if (clear) {
      await this.db.$transaction([
        this.db.userAvatar.deleteMany({ where: { userId } }),
        this.db.user.update({ where: { id: userId }, data: { image: null } }),
      ]);
      return { ok: true as const };
    }
    const trimmed = raw.trim();
    const isDataImage = trimmed.startsWith("data:image/");
    const isHttpUrl = trimmed.startsWith("https://") || trimmed.startsWith("http://");
    if (!isDataImage && !isHttpUrl) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_AVATAR_FORMAT" });
    }
    if (isDataImage) {
      await this.db.$transaction([
        this.db.userAvatar.upsert({
          where: { userId },
          create: { userId, imageData: trimmed },
          update: { imageData: trimmed },
        }),
        this.db.user.update({ where: { id: userId }, data: { image: null } }),
      ]);
      return { ok: true as const };
    }
    if (trimmed.length > 2048) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "IMAGE_URL_TOO_LONG" });
    }
    await this.db.$transaction([
      this.db.userAvatar.deleteMany({ where: { userId } }),
      this.db.user.update({ where: { id: userId }, data: { image: trimmed } }),
    ]);
    return { ok: true as const };
  }

  async updateProfileBasics(userId: string, input: UpdateProfileBasicsInput) {
    const name = input.name.trim();
    const data: { name: string; bio?: string | null; address?: string | null; publicBookingMinNoticeHours?: number } = {
      name,
    };
    if (input.bio !== undefined) {
      data.bio = input.bio === null || input.bio.trim().length === 0 ? null : input.bio.trim();
    }
    if (input.defaultAddress !== undefined) {
      data.address =
        input.defaultAddress === null || input.defaultAddress.trim().length === 0
          ? null
          : input.defaultAddress.trim();
    }
    if (input.publicBookingMinNoticeHours !== undefined) {
      data.publicBookingMinNoticeHours = input.publicBookingMinNoticeHours;
    }
    await this.db.user.update({
      where: { id: userId },
      data,
    });
    return { ok: true as const };
  }

  async updatePublicBookingPresence(userId: string, input: UpdatePublicBookingPresenceInput) {
    if (input.publicBookingSlug === undefined) {
      return { ok: true as const };
    }

    const raw = input.publicBookingSlug.trim().toLowerCase();
    const nextSlug = raw.length === 0 ? null : raw;
    if (nextSlug && RESERVED_PUBLIC_BOOKING_SLUGS.has(nextSlug)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "SLUG_RESERVED" });
    }

    try {
      await this.db.user.update({
        where: { id: userId },
        data: { publicBookingSlug: nextSlug },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new TRPCError({ code: "CONFLICT", message: "SLUG_ALREADY_TAKEN" });
      }
      throw e;
    }
    return { ok: true as const };
  }

  async updateCalendarAvailability(
    userId: string,
    input: { weekHours: WeekHoursInput; closedSlotKeys: string[] },
  ) {
    await this.db.user.update({
      where: { id: userId },
      data: {
        calendarWeekHours: input.weekHours as Prisma.InputJsonValue,
        calendarClosedSlotKeys: input.closedSlotKeys as Prisma.InputJsonValue,
      },
    });
    return { ok: true as const };
  }

  async archiveAccount(p: {
    userId: string;
    sessionEmail: string;
    confirmEmail: string;
    password?: string;
  }) {
    const normalizedConfirm = p.confirmEmail.trim().toLowerCase();
    const normalizedSession = p.sessionEmail.trim().toLowerCase();
    if (normalizedConfirm !== normalizedSession) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "CONFIRM_EMAIL_MISMATCH",
      });
    }

    const user = await this.db.user.findUnique({
      where: { id: p.userId },
      include: {
        accounts: {
          where: { providerId: "credential" },
        },
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "USER_NOT_FOUND" });
    }
    if (user.archivedAt) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "ALREADY_ARCHIVED" });
    }

    const credential = user.accounts.find((a) => a.password != null && a.password.length > 0);
    if (credential?.password) {
      if (!p.password?.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "PASSWORD_REQUIRED" });
      }
      const valid = await verifyPassword({
        hash: credential.password,
        password: p.password,
      });
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "INVALID_PASSWORD" });
      }
    }

    await this.db.$transaction([
      this.db.session.deleteMany({ where: { userId: p.userId } }),
      this.db.user.update({
        where: { id: p.userId },
        data: { archivedAt: new Date() },
      }),
    ]);

    return { ok: true as const };
  }
}
