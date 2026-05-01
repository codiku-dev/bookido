import { CreateTRPCReact, createTRPCReact, httpBatchLink, loggerLink } from "@trpc/react-query";
import { AppRouter } from "@repo/trpc/router";
import { QueryClient } from "@tanstack/react-query";
import { getDevSimulateStripeReadyHeaderValue } from "@web/utils/dev-simulate-stripe";

export const trpc: CreateTRPCReact<AppRouter, object> =
  createTRPCReact<AppRouter, object>();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function isExpectedPublicCoachNotFoundLog(opts: {
  direction: "up" | "down";
  path?: string;
  result?: unknown;
}): boolean {
  return (
    opts.direction === "down" &&
    opts.path === "publicBooking.getStorefront" &&
    opts.result instanceof Error &&
    opts.result.message === "COACH_NOT_FOUND"
  );
}

export const trpcClient = trpc.createClient({

  links: [
    loggerLink({
      enabled: (opts) => {
        if (isExpectedPublicCoachNotFoundLog(opts)) {
          return false;
        }
        return (
          (process.env["NODE_ENV"] === "development" && typeof window !== "undefined") ||
          (opts.direction === "down" && opts.result instanceof Error)
        );
      },
    }),
    httpBatchLink({
      url: process.env["NEXT_PUBLIC_API_BASE_URL"] + "/trpc",
      headers() {
        const stripeSim = getDevSimulateStripeReadyHeaderValue();
        if (stripeSim === undefined) {
          return {};
        }
        return { "x-bookido-dev-simulate-stripe-ready": stripeSim };
      },
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});
