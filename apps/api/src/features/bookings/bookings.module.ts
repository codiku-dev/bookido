import { Module } from "@nestjs/common";

import { PrismaModule } from "@api/src/infrastructure/prisma/prisma.module";

import { BookingsRouter } from "./bookings.router";
import { BookingsService } from "./bookings.service";

@Module({
  imports: [PrismaModule],
  providers: [BookingsService, BookingsRouter],
  exports: [BookingsRouter, BookingsService],
})
export class BookingsModule {}
