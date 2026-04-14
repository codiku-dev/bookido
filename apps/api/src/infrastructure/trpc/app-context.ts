import { Injectable } from '@nestjs/common';
import { ContextOptions, TRPCContext } from 'nestjs-trpc';
// Use to provideer req and res to better auth for exemple through a middleware
@Injectable()
export class AppContext implements TRPCContext {
  async create(opts: ContextOptions): Promise<Record<string, unknown>> {
    return {
      req: opts.req,
      res: opts.res,
    };
  }
}
