import { Module } from "@nestjs/common";

import { ClientsService } from "./clients.service";
import { ClientsRouter } from "./clients.router";

@Module({
  providers: [ClientsService, ClientsRouter],
  exports: [ClientsRouter],
})
export class ClientsModule {}
