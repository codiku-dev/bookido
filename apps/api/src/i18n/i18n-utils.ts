import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type Lang = "en" | "fr";

const apiRoot = process.cwd();
const i18nCache = new Map<Lang, unknown>();

function getHeader(headers: unknown, name: string): string | undefined {
  if (!headers || typeof headers !== "object") {
    return undefined;
  }
  const lower = name.toLowerCase();
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(lower) ?? undefined;
  }
  const h = headers as Record<string, string | string[] | undefined>;
  const v = h[lower] ?? h[name];
  if (Array.isArray(v)) {
    return v[0];
  }
  return typeof v === "string" ? v : undefined;
}

/** Resolves UI language from auth / HTTP requests (Better Auth client sends `X-Bookido-Locale` + `Accept-Language`). */
export function getLangFromRequest(p: { request: unknown }): Lang {
  const headersAny = (p.request as { headers?: unknown })?.headers;

  const bookido = getHeader(headersAny, "x-bookido-locale")?.trim().toLowerCase();
  if (bookido === "fr" || bookido?.startsWith("fr")) {
    return "fr";
  }
  if (bookido === "en" || bookido?.startsWith("en")) {
    return "en";
  }

  const rawAccept = getHeader(headersAny, "accept-language");
  const first = rawAccept?.split(",")?.[0]?.trim()?.toLowerCase() ?? "";
  if (first.startsWith("fr")) {
    return "fr";
  }
  return "en";
}

function getTranslations(p: { lang: Lang }) {
  const cached = i18nCache.get(p.lang);
  if (cached) return cached as Record<string, unknown>;

  const isProd = process.env["NODE_ENV"] === "production";
  const base = resolve(apiRoot, isProd ? "dist/i18n" : "src/i18n");
  const filePath = resolve(base, p.lang, "common.json");

  const json = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  i18nCache.set(p.lang, json);
  return json;
}

export function t(p: { lang: Lang; key: string }): string {
  const dict = getTranslations({ lang: p.lang });
  const value = p.key.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], dict) as string;

  return value;
}
