# With-NestJs | API

## Getting Started

First, run the development server:

```bash
pnpm run dev
# Also works with NPM, YARN, BUN, ...
```

By default, your server will run at [localhost:3000](http://localhost:3000). You can use your favorite API platform like [Insomnia](https://insomnia.rest/) or [Postman](https://www.postman.com/) to test your APIs

You can start editing the demo **APIs** by modifying [linksService](./src/links/links.service.ts) provider.

### Protected routes & session

Routes are protected by default via `@AuthGuard` on the router. Use `@Public()` for public procedures and `@Roles(['admin'])` for role-restricted procedures. In protected procedures, inject the tRPC context with `@Ctx() ctx: BaseUserSession` to access the authenticated user and session:

```ts
import { Ctx, Query, Router } from 'nestjs-trpc';
import { z } from 'zod';
import { AuthGuard } from '@api/src/infrastructure/decorators/auth/auth-guard.decorator';
import { Public } from '@api/src/infrastructure/decorators/auth/public-procedure.decorator';
import { Roles } from '@api/src/infrastructure/decorators/auth/roles-procedure.decorator';
import { BaseUserSession } from '@thallesp/nestjs-better-auth';

@Router({ alias: 'app' })
@AuthGuard()
export class AppRouter {
  @Public()
  @Query({ output: z.object({ message: z.string() }) })
  async hello() {
    return { message: 'Hello from public route' };
  }

  @Query({ output: z.object({ message: z.string() }) })
  async protectedHello(@Ctx() ctx: BaseUserSession) {
    const { user, session } = ctx; // user + session from better-auth
    return { message: `Hello ${user?.email} (session: ${session?.id})` };
  }

  @Roles(['admin'])
  @Query({ output: z.object({ message: z.string() }) })
  async roleProtectedHello(@Ctx() ctx: BaseUserSession) {
    return { message: 'Admin only' };
  }
}
```

### Auth hooks (sign-up / sign-in)

Use Better Auth’s `hooks.before` / `databaseHooks` in `src/features/authentication/auth.ts` (see the archived-account check on `/sign-in/email`). Avoid stacking several `@BeforeHook` Nest providers for the same `hooks.before` slot: `nestjs-better-auth` composes them into one middleware and path guards can break the chain.

### Important Note 🚧

If you plan to `build` or `test` the app. Please make sure to build the `packages/*` first.

## Learn More

Learn more about `NestJs` with following resources:

- [Official Documentation](https://docs.nestjs.com) - A progressive Node.js framework for building efficient, reliable and scalable server-side applications.
- [Official NestJS Courses](https://courses.nestjs.com) - Learn everything you need to master NestJS and tackle modern backend applications at any scale.
- [GitHub Repo](https://github.com/nestjs/nest)
