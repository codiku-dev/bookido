import { messages, type EmailLocale } from "./messages";

type Values = Record<string, string>;

export function t(p: {
  locale: EmailLocale;
  key: string;
  values?: Values;
}): string {
  const dict = messages[p.locale] ?? messages.en;
  const template = dict[p.key] ?? messages.en[p.key] ?? p.key;

  if (!p.values) return template;

  return template.replace(/\{(\w+)\}/g, (match, k: string) => {
    const v = p.values?.[k];
    return typeof v === "string" ? v : match;
  });
}

