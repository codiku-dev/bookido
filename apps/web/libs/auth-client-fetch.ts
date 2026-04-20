/**
 * Wraps `fetch` so Better Auth requests carry the UI locale (from `<html lang>` / next-intl)
 * to the API. The Nest app reads `Accept-Language` and `X-Bookido-Locale` in `getLangFromRequest`.
 */
export function createLocaleAwareFetch(): typeof fetch {
  const impl = (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (typeof document !== "undefined") {
      const raw = document.documentElement.getAttribute("lang") ?? "";
      const tag = raw.split("-")[0]?.toLowerCase() ?? "";
      if (tag === "fr" || tag === "en") {
        headers.set("X-Bookido-Locale", tag);
      }
      headers.set(
        "Accept-Language",
        tag === "fr" ? "fr-FR,fr;q=0.9,en;q=0.8" : "en-US,en;q=0.9,fr;q=0.8",
      );
    }
    return fetch(input, { ...init, headers });
  };
  Object.assign(impl, { preconnect: fetch.preconnect });
  return impl as typeof fetch;
}
