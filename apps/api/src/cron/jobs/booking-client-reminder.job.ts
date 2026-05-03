import { Injectable, Logger } from "@nestjs/common";
import { BookingClientReminder, emailBookidoLogoCidSrc, type EmailLocale } from "@repo/emails";

import { PrismaService } from "@api/src/infrastructure/prisma/prisma.service";
import { resolveUserDisplayImage } from "@api/src/features/profile/profile.service";
import { sendEmail } from "@api/src/libs/email-libs";

const REMINDER_WINDOW_HOURS = 25;
const BATCH = 80;
const MAX_ROUNDS = 100;

export type BookingClientReminderJobResult = {
  disabled: boolean;
  reason?: string;
  rounds: number;
  scanned: number;
  sent: number;
  skippedInvalidEmail: number;
  sendFailed: number;
};

@Injectable()
export class BookingClientReminderJob {
  private readonly logger = new Logger(BookingClientReminderJob.name);

  constructor(private readonly db: PrismaService) {}

  private resolveReminderLocale(): EmailLocale {
    const raw = (process.env["CLIENT_REMINDER_EMAIL_LOCALE"] ?? "").trim().toLowerCase();
    return raw === "en" ? "en" : "fr";
  }

  async run(): Promise<BookingClientReminderJobResult> {
    if (process.env["DISABLE_CLIENT_BOOKING_REMINDERS"] === "1") {
      return { disabled: true, reason: "DISABLE_CLIENT_BOOKING_REMINDERS=1", rounds: 0, scanned: 0, sent: 0, skippedInvalidEmail: 0, sendFailed: 0 };
    }

    const now = new Date();
    const horizon = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000);
    const locale = this.resolveReminderLocale();
    const dateLocale = locale === "fr" ? "fr-FR" : "en-US";

    let rounds = 0;
    let scanned = 0;
    let sent = 0;
    let skippedInvalidEmail = 0;
    let sendFailed = 0;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const rows = await this.db.booking.findMany({
        where: {
          status: "confirmed",
          clientReminder24hSentAt: null,
          startsAt: { gt: now, lte: horizon },
        },
        orderBy: { startsAt: "asc" },
        take: BATCH,
        select: {
          id: true,
          startsAt: true,
          durationMinutes: true,
          location: true,
          client: { select: { email: true, name: true } },
          service: { select: { name: true, address: true, durationMinutes: true } },
          owner: {
            select: {
              name: true,
              email: true,
              image: true,
              userAvatar: { select: { imageData: true } },
            },
          },
        },
      });

      if (rows.length === 0) {
        break;
      }
      rounds += 1;
      scanned += rows.length;

      for (const b of rows) {
        const to = (b.client.email ?? "").trim().toLowerCase();
        if (to.length === 0 || !to.includes("@")) {
          skippedInvalidEmail += 1;
          this.logger.warn(`[booking-client-reminder] skip bookingId=${b.id} invalid client email`);
          await this.db.booking.updateMany({
            where: { id: b.id, clientReminder24hSentAt: null },
            data: { clientReminder24hSentAt: new Date() },
          });
          continue;
        }

        const claim = await this.db.booking.updateMany({
          where: { id: b.id, status: "confirmed", clientReminder24hSentAt: null },
          data: { clientReminder24hSentAt: new Date() },
        });
        if (claim.count === 0) {
          continue;
        }

        const address = ((b.service.address ?? "").trim().length > 0 ? b.service.address : b.location).trim();
        const mapsUrl =
          address.length > 0 ? `https://www.google.com/maps?q=${encodeURIComponent(address)}` : null;
        const durationMinutes = Math.max(1, b.service.durationMinutes ?? b.durationMinutes);
        const sessionStartLabel = new Intl.DateTimeFormat(dateLocale, {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(b.startsAt);

        const subject =
          locale === "fr"
            ? `Rappel — votre rendez-vous approche (${b.service.name})`
            : `Reminder — your appointment is coming up (${b.service.name})`;

        try {
          await sendEmail({
            to,
            replyTo: (b.owner.email ?? "").trim().length > 0 ? b.owner.email.trim() : undefined,
            subject,
            component: BookingClientReminder({
              locale,
              brandLogoSrc: emailBookidoLogoCidSrc(),
              clientName: b.client.name.trim() || to,
              coachName: b.owner.name,
              coachReplyToEmail: b.owner.email,
              coachImageUrl: resolveUserDisplayImage(b.owner),
              serviceName: b.service.name,
              sessionStartLabel,
              durationMinutes,
              serviceAddress: address,
              serviceMapsUrl: mapsUrl,
            }),
          });
          sent += 1;
          this.logger.log(`[booking-client-reminder] sent bookingId=${b.id} to=${to}`);
        } catch (err) {
          sendFailed += 1;
          const message = err instanceof Error ? err.message : String(err);
          this.logger.error(`[booking-client-reminder] send failed bookingId=${b.id} error=${message}`);
          await this.db.booking.updateMany({
            where: { id: b.id },
            data: { clientReminder24hSentAt: null },
          });
        }
      }
    }

    return { disabled: false, rounds, scanned, sent, skippedInvalidEmail, sendFailed };
  }
}
