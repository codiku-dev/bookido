import { PrismaService } from '@api/src/infrastructure/prisma/prisma.service';
import { Ctx, Query, Router, } from 'nestjs-trpc';
import { Inject } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '@api/src/infrastructure/decorators/auth/auth-guard.decorator';
import { Public } from '@api/src/infrastructure/decorators/auth/public-procedure.decorator';
import { Roles } from '@api/src/infrastructure/decorators/auth/roles-procedure.decorator';
import { BaseUserSession } from '@thallesp/nestjs-better-auth';

@Router({ alias: 'app' })
@AuthGuard({ logs: true })
export class AppRouter {

    @Public()
    @Query({ output: z.object({ message: z.string() }) })
    async hello() {
        return { message: `Hello from public route at ${new Date().toISOString()}` };
    }

    @Query({ output: z.object({ message: z.string() }) })
    async protectedHello(@Ctx() ctx: BaseUserSession) {
        const { user } = ctx;
        return { message: `${user?.email} authenticated, at ${new Date().toISOString()}` };
    }
    @Roles(['admin'])
    @Query({ output: z.object({ message: z.string() }) })
    async roleProtectedHello(@Ctx() ctx: BaseUserSession) {
        return { message: `Hello from role protected route at ${new Date().toISOString()}` };
    }
}