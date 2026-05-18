import { isDevToolsEnabled } from "@web/utils/is-dev-tools-enabled";

export const DEV_SIMULATE_STRIPE_READY_STORAGE_KEY = "bookido_dev_simulate_stripe_ready";

export function getDevSimulateStripeReadyFromStorage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(DEV_SIMULATE_STRIPE_READY_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setDevSimulateStripeReadyInStorage(value: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (value) {
      window.localStorage.setItem(DEV_SIMULATE_STRIPE_READY_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(DEV_SIMULATE_STRIPE_READY_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** Header value for tRPC when simulation is on (dev / staging only). */
export function getDevSimulateStripeReadyHeaderValue(): string | undefined {
  if (!isDevToolsEnabled()) {
    return undefined;
  }
  if (typeof window === "undefined") {
    return undefined;
  }
  return getDevSimulateStripeReadyFromStorage() ? "1" : undefined;
}
