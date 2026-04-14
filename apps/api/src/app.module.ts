import { Module } from "@nestjs/common";
import * as path from "path";
import { I18nModule } from "nestjs-i18n";

import { UsersModule } from "@api/src/features/users/users.module";
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
import { TrpcPanelController } from "@api/src/infrastructure/docs/docs.controller";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "@api/src/features/authentication/auth";
// Relative path so nestjs-trpc generator can resolve the context (it doesn't use path aliases)
import { AppContext } from "./infrastructure/trpc/app-context";
import { SignUpHook } from "./features/authentication/signup-hook";
import { SignInHook } from "./features/authentication/signin-hook";

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
    TrpcMiddlewaresModule,
    TRPCModule.forRoot({
      autoSchemaFile: path.resolve(__dirname, "../../../../packages/trpc/src"),
      context: AppContext,
    }),
    AuthModule.forRoot({ auth, disableTrustedOriginsCors: true }),
  ],
  controllers: [TrpcPanelController],
  providers: [
    AppService,
    AppRouter,
    AppContext,
    { provide: TRPC_ROUTER_TYPES, useValue: [AppRouter, UserRouter] },
    PublicPathScannerService,
    RolesPathScannerService,
    SignUpHook,
    SignInHook,
  ],
})
export class AppModule { }