/**
 * Wraps `fetch` so Better Auth requests carry the UI locale (from `<html lang>` / next-intl)
 * to the API. The Nest app reads `Accept-Language` and `X-Bookido-Locale` in `getLangFromRequest`.
 *
 * Also strips huge `data:` URLs in `image` fields on Better Auth JSON responses. Storing a profile
 * photo as base64 in `user.image` makes `/sign-in/email` bodies multi‑MB; `response.text()` +
 * `JSON.parse` then blocks the main thread long enough that sign-in appears stuck on "Signing in…".
 */

const HEAVY_DATA_URL_IMAGE_MIN_LENGTH = 4096;

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

function isBetterAuthJsonResponse(url: string, res: Response): boolean {
  if (!res.ok) {
    return false;
  }
  let pathname = "";
  try {
    pathname = new URL(url, "http://localhost").pathname;
  } catch {
    pathname = url;
  }
  if (!pathname.includes("/api/auth/")) {
    return false;
  }
  const ct = res.headers.get("content-type") ?? "";
  return ct.includes("application/json") || ct.includes("text/json");
}

function stripHeavyDataUrlImagesFromAuthJson(node: unknown): void {
  if (node === null || node === undefined) {
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      stripHeavyDataUrlImagesFromAuthJson(item);
    }
    return;
  }
  if (typeof node !== "object") {
    return;
  }
  const o = node as Record<string, unknown>;
  for (const key of Object.keys(o)) {
    const v = o[key];
    if (
      key === "image" &&
      typeof v === "string" &&
      v.startsWith("data:") &&
      v.length >= HEAVY_DATA_URL_IMAGE_MIN_LENGTH
    ) {
      o[key] = null;
      continue;
    }
    stripHeavyDataUrlImagesFromAuthJson(v);
  }
}

function copyHeadersWithoutContentLength(res: Response): Headers {
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  return headers;
}

async function maybeShrinkBetterAuthJsonBody(res: Response): Promise<Response> {
  const text = await res.text();
  if (!text.includes("data:") || text.length < HEAVY_DATA_URL_IMAGE_MIN_LENGTH) {
    return new Response(text, {
      status: res.status,
      statusText: res.statusText,
      headers: copyHeadersWithoutContentLength(res),
    });
  }
  try {
    const parsed: unknown = JSON.parse(text);
    stripHeavyDataUrlImagesFromAuthJson(parsed);
    const out = JSON.stringify(parsed);
    return new Response(out, {
      status: res.status,
      statusText: res.statusText,
      headers: copyHeadersWithoutContentLength(res),
    });
  } catch {
    return new Response(text, {
      status: res.status,
      statusText: res.statusText,
      headers: copyHeadersWithoutContentLength(res),
    });
  }
}

export function createLocaleAwareFetch(): typeof fetch {
  const impl = async (input: RequestInfo | URL, init?: RequestInit) => {
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
    const url = resolveRequestUrl(input);
    const res = await fetch(input, { ...init, headers });
    if (!isBetterAuthJsonResponse(url, res)) {
      return res;
    }
    return maybeShrinkBetterAuthJsonBody(res);
  };
  Object.assign(impl, { preconnect: fetch.preconnect });
  return impl as typeof fetch;
}
