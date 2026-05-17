/** Post-auth redirect URL (email verify, OAuth, etc.) — must match an API `trustedOrigins` entry. */
export function getAuthCallbackURL(fallbackPath = "/admin/signin"): string {
  const fromEnv = process.env["NEXT_PUBLIC_AUTH_CALLBACK_URL"];
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}${fallbackPath}`;
  }
  return "";
}
