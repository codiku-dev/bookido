/** Session flag: user reached `/{coach}/services` via client nav from site home `/`. */
export const BOOKIDO_PUBLIC_SERVICES_BACK_FROM_HOME_KEY = "bookido_public_services_back_from_home_v1";

export function isPublicCoachServicesPath(pathname: string) {
  return /^\/[^/]+\/services\/?$/.test(pathname);
}

export function isPublicCoachBookingPath(pathname: string) {
  return /^\/[^/]+\/booking/.test(pathname);
}
