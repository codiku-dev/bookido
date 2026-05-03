import { Module } from "@nestjs/common";

import { PrismaModule } from "@api/src/infrastructure/prisma/prisma.module";
import { BookingClientReminderJob } from "@api/src/cron/jobs/booking-client-reminder.job";

@Module({
  imports: [PrismaModule],
  providers: [BookingClientReminderJob],
  exports: [BookingClientReminderJob],
})
export class CronJobsModule {}
