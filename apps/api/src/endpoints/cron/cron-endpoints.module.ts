import { Module } from "@nestjs/common";

import { CronJobsModule } from "@api/src/cron/cron-jobs.module";
import { CronController } from "@api/src/endpoints/cron/cron.controller";

@Module({
  imports: [CronJobsModule],
  controllers: [CronController],
})
export class CronEndpointsModule {}
