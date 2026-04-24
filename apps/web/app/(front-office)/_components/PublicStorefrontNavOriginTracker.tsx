"use client";

import { useInsertionEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import {
  BOOKIDO_PUBLIC_SERVICES_BACK_FROM_HOME_KEY,
  isPublicCoachBookingPath,
  isPublicCoachServicesPath,
} from "#/utils/public-storefront-nav-origin";

/**
 * Runs in useInsertionEffect so it fires before descendant useLayoutEffect
 * (e.g. coach services page reading the session flag).
 */
export function PublicStorefrontNavOriginTracker() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  useInsertionEffect(() => {
    const prev = prevPathRef.current;
    const next = pathname;

    if (prev === null && isPublicCoachServicesPath(next)) {
      try {
        sessionStorage.removeItem(BOOKIDO_PUBLIC_SERVICES_BACK_FROM_HOME_KEY);
      } catch {
        /* ignore */
      }
    } else if (prev !== null && isPublicCoachServicesPath(next)) {
      if (prev === "/") {
        try {
          sessionStorage.setItem(BOOKIDO_PUBLIC_SERVICES_BACK_FROM_HOME_KEY, "1");
        } catch {
          /* ignore */
        }
      } else if (!isPublicCoachBookingPath(prev) && prev !== next) {
        try {
          sessionStorage.removeItem(BOOKIDO_PUBLIC_SERVICES_BACK_FROM_HOME_KEY);
        } catch {
          /* ignore */
        }
      }
    }

    prevPathRef.current = next;
  }, [pathname]);

  return null;
}
