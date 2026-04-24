/** Cookie lu par `proxy.ts` pour protéger `/admin` côté Next (session Better Auth sur l’API). */
const COOKIE_NAME = "admin-authenticated";

export function setAdminAuthBridgeCookie() {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${COOKIE_NAME}=true; path=/; max-age=86400; samesite=lax`;
}

export function clearAdminAuthBridgeCookie() {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}
