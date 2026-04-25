import { Module } from "@nestjs/common";

import { PrismaModule } from "@api/src/infrastructure/prisma/prisma.module";
import { StripeModule } from "@api/src/features/stripe/stripe.module";
import { ProfileRouter } from "./profile.router";
import { ProfileService } from "./profile.service";

@Module({
  imports: [PrismaModule, StripeModule],
  providers: [ProfileService, ProfileRouter],
  exports: [ProfileRouter, ProfileService],
})
export class ProfileModule { }
