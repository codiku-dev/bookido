import { All, Controller, Header, Inject, OnModuleInit, Req } from '@nestjs/common';
import { Request } from 'express';
import { renderTrpcPanel } from 'trpc-ui';
import { AnyRouter } from '@trpc/server';
import { AppRouterHost } from 'nestjs-trpc';
import { OptionalAuth } from '@thallesp/nestjs-better-auth';
import { getBaseUrl } from '@api/src/infrastructure/utils/request-url';

@Controller("docs")
export class TrpcPanelController implements OnModuleInit {
    private appRouter!: AnyRouter;

    constructor(@Inject(AppRouterHost) private readonly appRouterHost: AppRouterHost) { }

    onModuleInit() {
        this.appRouter = this.appRouterHost.appRouter;
    }

    @All()
    @Header('Content-Type', 'text/html')
    @OptionalAuth()
    panel(@Req() req: Request): string {
        return renderTrpcPanel(this.appRouter, {
            url: getBaseUrl(req) + '/trpc',
            meta: {
                title: "API Documentation",
                description:
                    "This is the documentation of the API.",
            },
        })
    }
}