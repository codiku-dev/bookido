import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type Lang = "en" | "fr";

const apiRoot = process.cwd();
const i18nCache = new Map<Lang, unknown>();

export function getLangFromRequest(p: { request: unknown }): Lang {
  const headersAny = (p.request as { headers?: unknown })?.headers;
  console.log("headersAny", headersAny);
  let raw: string | string[] | null | undefined;
  if (headersAny && typeof (headersAny as any).get === "function") {
    raw = (headersAny as any).get("accept-language");
    console.log("raw 1", raw);
  } else if (headersAny && typeof headersAny === "object") {
    console.log("headersAny is object", headersAny);
    const h = headersAny as Record<string, string | string[] | undefined>;
    raw = h["accept-language"] ?? h["Accept-Language"];
    console.log("raw 2", raw);
  }
  const first = Array.isArray(raw) ? raw[0] : raw;
  const lang = first?.split(",")?.[0]?.trim()?.toLowerCase();

  if (lang?.startsWith("fr")) return "fr";
  return "en";
}

function getTranslations(p: { lang: Lang }) {
  const cached = i18nCache.get(p.lang);
  if (cached) return cached as Record<string, unknown>;

  const isProd = process.env["NODE_ENV"] === "production";
  const base = resolve(apiRoot, isProd ? "dist/i18n" : "src/i18n");
  const filePath = resolve(base, p.lang, "common.json");

  const json = JSON.parse(readFileSync(filePath, "utf8")) as Record<
    string,
    unknown
  >;
  i18nCache.set(p.lang, json);
  return json;
}

export function t(p: {
  lang: Lang;
  key: string;
}): string {
  const dict = getTranslations({ lang: p.lang });
  const value = p.key.split(".").reduce<unknown>(
    (acc, k) => (acc as Record<string, unknown>)?.[k],
    dict
  ) as string;

  return value
}

