function formatGcalUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${day}T${h}${min}${s}Z`;
}

/** Opens Google Calendar with a prefilled event (UTC `dates` range). */
export function buildGoogleCalendarEventUrl(p: {
  title: string;
  startUtc: Date;
  endUtc: Date;
  details?: string;
  location?: string;
}): string {
  const dates = `${formatGcalUtc(p.startUtc)}/${formatGcalUtc(p.endUtc)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: p.title,
    dates,
    details: p.details ?? "",
    location: p.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
