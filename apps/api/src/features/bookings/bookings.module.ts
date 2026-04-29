import { Module } from "@nestjs/common";

import { PrismaModule } from "@api/src/infrastructure/prisma/prisma.module";
import { StripeModule } from "@api/src/features/stripe/stripe.module";

import { BookingsRouter } from "./bookings.router";
import { BookingsService } from "./bookings.service";

@Module({
  imports: [PrismaModule, StripeModule],
  providers: [BookingsService, BookingsRouter],
  exports: [BookingsRouter, BookingsService],
})
export class BookingsModule {}
