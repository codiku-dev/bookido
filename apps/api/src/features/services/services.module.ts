import { Module } from "@nestjs/common";
import { PrismaModule } from "@api/src/infrastructure/prisma/prisma.module";
import { ServiceRouter } from "./services.router";
import { ServicesService } from "./services.service";

@Module({
  imports: [PrismaModule],
  providers: [ServicesService, ServiceRouter],
  exports: [ServiceRouter, ServicesService],
})
export class ServicesModule {}
