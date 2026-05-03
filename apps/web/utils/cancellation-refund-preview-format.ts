export type CancellationRefundPreviewLocale = "fr" | "en";

export function formatRefundPreviewMoney(locale: CancellationRefundPreviewLocale, amount: number): string {
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return new Intl.NumberFormat(loc, { style: "currency", currency: "EUR" }).format(amount);
}

export function formatRefundPreviewDateTime(locale: CancellationRefundPreviewLocale, iso: string): string {
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return new Intl.DateTimeFormat(loc, { dateStyle: "long", timeStyle: "short" }).format(new Date(iso));
}
