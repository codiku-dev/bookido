import { Module } from "@nestjs/common";

import { PrismaModule } from "@api/src/infrastructure/prisma/prisma.module";

import { DashboardRouter } from "./dashboard.router";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [PrismaModule],
  providers: [DashboardService, DashboardRouter],
  exports: [DashboardRouter],
})
export class DashboardModule {}
