import { Injectable } from "@nestjs/common";
import { ContextOptions, TRPCContext } from "nestjs-trpc";

function readDevSimulateStripeReadyHeader(req: ContextOptions["req"]): boolean {
  if (process.env["NODE_ENV"] !== "development") {
    return false;
  }
  const raw = req?.headers?.["x-bookido-dev-simulate-stripe-ready"];
  const v = Array.isArray(raw) ? raw[0] : raw;
  return String(v ?? "").trim() === "1";
}

// Use to provideer req and res to better auth for exemple through a middleware
@Injectable()
export class AppContext implements TRPCContext {
  async create(opts: ContextOptions): Promise<Record<string, unknown>> {
    return {
      req: opts.req,
      res: opts.res,
      devSimulateStripeReady: readDevSimulateStripeReadyHeader(opts.req),
    };
  }
}
