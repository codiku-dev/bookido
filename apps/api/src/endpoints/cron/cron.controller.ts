import {
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  Post,
  ServiceUnavailableException,
} from "@nestjs/common";

import { BookingClientReminderJob } from "@api/src/cron/jobs/booking-client-reminder.job";

function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization) {
    return null;
  }
  const m = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return m?.[1]?.trim() ?? null;
}

@Controller("cron")
export class CronController {
  constructor(private readonly bookingClientReminderJob: BookingClientReminderJob) {}

  @Post("jobs/booking-client-reminder")
  @HttpCode(200)
  async postBookingClientReminder(
    @Headers("authorization") authorization: string | undefined,
    @Headers("x-bookido-cron-secret") headerSecret: string | undefined,
  ) {
    const expected = (process.env["CRON_SECRET"] ?? "").trim();
    if (expected.length === 0) {
      throw new ServiceUnavailableException("CRON_SECRET is not configured");
    }

    const bearer = extractBearerToken(authorization);
    const fromHeader = (headerSecret ?? "").trim();
    const provided = bearer ?? fromHeader;
    if (provided.length === 0 || provided !== expected) {
      throw new ForbiddenException();
    }

    return this.bookingClientReminderJob.run();
  }
}
