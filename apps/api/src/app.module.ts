import { Module } from "@nestjs/common";
import * as path from "path";
import { I18nModule } from "nestjs-i18n";

import { UsersModule } from "@api/src/features/users/users.module";
import { ClientsModule } from "@api/src/features/clients/clients.module";
import { ProfileModule } from "@api/src/features/profile/profile.module";
import { ServicesModule } from "@api/src/features/services/services.module";
import { BookingsModule } from "@api/src/features/bookings/bookings.module";
import { DashboardModule } from "@api/src/features/dashboard/dashboard.module";
import { PublicBookingModule } from "@api/src/features/public-booking/public-booking.module";
import { StripeModule } from "@api/src/features/stripe/stripe.module";
import { PrismaModule } from "@api/src/infrastructure/prisma/prisma.module";

import { AppService } from "@api/src/app.service";
import { TRPCModule } from "nestjs-trpc";
import { AppRouter } from "@api/src/app.router";
import { TrpcMiddlewaresModule } from "@api/src/infrastructure/middlewares/trpc-middlewares.module";
import {
  PublicPathScannerService,
  TRPC_ROUTER_TYPES,
} from "@api/src/infrastructure/middlewares/public-path-scanner.service";
import { RolesPathScannerService } from "@api/src/infrastructure/middlewares/roles-path-scanner.service";
import { UserRouter } from "@api/src/features/users/users.router";
import { ClientsRouter } from "@api/src/features/clients/clients.router";
import { ProfileRouter } from "@api/src/features/profile/profile.router";
import { ServiceRouter } from "@api/src/features/services/services.router";
import { BookingsRouter } from "@api/src/features/bookings/bookings.router";
import { DashboardRouter } from "@api/src/features/dashboard/dashboard.router";
import { PublicBookingRouter } from "@api/src/features/public-booking/public-booking.router";
import { TrpcPanelController } from "@api/src/infrastructure/docs/docs.controller";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "@api/src/features/authentication/auth";
// Relative path so nestjs-trpc generator can resolve the context (it doesn't use path aliases)
import { AppContext } from "./infrastructure/trpc/app-context";
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: "en",
      loaderOptions: {
        path: path.join(__dirname, "/i18n/"),
        watch: true,
      },
    }),
    PrismaModule,
    UsersModule,
    ClientsModule,
    ProfileModule,
    ServicesModule,
    BookingsModule,
    DashboardModule,
    PublicBookingModule,
    StripeModule,
    TrpcMiddlewaresModule,
    TRPCModule.forRoot({
      autoSchemaFile: path.resolve(__dirname, "../../../../packages/trpc/src"),
      context: AppContext,
    }),
    AuthModule.forRoot({
      auth,
      disableTrustedOriginsCors: true,
      /** Default express.json limit is 100kb; service payloads include base64 images. */
      bodyParser: {
        json: { limit: "10mb" },
        urlencoded: { limit: "10mb", extended: true },
      },
    }),
  ],
  controllers: [TrpcPanelController],
  providers: [
    AppService,
    AppRouter,
    AppContext,
    {
      provide: TRPC_ROUTER_TYPES,
      useValue: [
        AppRouter,
        UserRouter,
        ClientsRouter,
        ServiceRouter,
        ProfileRouter,
        BookingsRouter,
        DashboardRouter,
        PublicBookingRouter,
      ],
    },
    PublicPathScannerService,
    RolesPathScannerService,
  ],
})
export class AppModule { }