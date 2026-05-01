import { TRPCClientError } from "@trpc/client";

/** Coach slug unknown, archived, or public site unpublished — `getStorefront` returns this. */
export function isPublicCoachStorefrontNotFoundError(error: unknown): boolean {
  return error instanceof TRPCClientError && error.message === "COACH_NOT_FOUND";
}
