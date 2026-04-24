import { Module } from "@nestjs/common";

import { PrismaModule } from "@api/src/infrastructure/prisma/prisma.module";
import { ProfileRouter } from "./profile.router";
import { ProfileService } from "./profile.service";

@Module({
  imports: [PrismaModule],
  providers: [ProfileService, ProfileRouter],
  exports: [ProfileRouter, ProfileService],
})
export class ProfileModule { }
