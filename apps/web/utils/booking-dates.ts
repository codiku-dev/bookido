export function bookingLocalDateKey(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function bookingLocalTimeHm(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

export function paymentKindFromAmounts(paid: number, amount: number): "paid" | "partial" | "unpaid" {
  const p = Math.min(amount, Math.max(0, paid));
  if (p >= amount - 1e-6) {
    return "paid";
  }
  if (p > 1e-6) {
    return "partial";
  }
  return "unpaid";
}

export function getBookingAmountRemaining(paid: number, amount: number): number {
  return Math.round(Math.max(0, amount - Math.min(amount, Math.max(0, paid))) * 100) / 100;
}

/** Total minutes since midnight → `HH:mm` (24h). */
export function totalMinutesToTimeHm(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
