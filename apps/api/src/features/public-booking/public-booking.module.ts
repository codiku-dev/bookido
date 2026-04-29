import { Module } from "@nestjs/common";

import { PrismaModule } from "@api/src/infrastructure/prisma/prisma.module";
import { BookingsModule } from "@api/src/features/bookings/bookings.module";
import { ProfileModule } from "@api/src/features/profile/profile.module";
import { ServicesModule } from "@api/src/features/services/services.module";
import { StripeModule } from "@api/src/features/stripe/stripe.module";

import { PublicBookingRouter } from "./public-booking.router";
import { PublicBookingService } from "./public-booking.service";

@Module({
  imports: [PrismaModule, ProfileModule, ServicesModule, BookingsModule, StripeModule],
  providers: [PublicBookingService, PublicBookingRouter],
  exports: [PublicBookingRouter],
})
export class PublicBookingModule {}
