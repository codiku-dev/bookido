function icsEscapeText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcsUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${day}T${h}${min}${s}Z`;
}

/** RFC 5545 calendar with one VEVENT per session (UTC). */
export function buildBookingSessionsIcs(p: {
  sessionsIso: string[];
  durationMinutes: number;
  summary: string;
  description: string;
  location?: string;
}): string {
  const durationMs = Math.max(1, p.durationMinutes) * 60_000;
  const dtstamp = formatIcsUtc(new Date());
  const summary = icsEscapeText(p.summary.trim().length > 0 ? p.summary.trim() : "Bookido");
  const descriptionRaw = p.description.trim();
  const description = descriptionRaw.length > 0 ? icsEscapeText(descriptionRaw) : "";
  const location =
    typeof p.location === "string" && p.location.trim().length > 0 ? icsEscapeText(p.location.trim()) : "";

  const starts = [...p.sessionsIso]
    .map((iso) => new Date(iso))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bookido//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (let idx = 0; idx < starts.length; idx += 1) {
    const start = starts[idx]!;
    const end = new Date(start.getTime() + durationMs);
    const uid = `bookido-${start.getTime()}-${idx}@bookido`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${formatIcsUtc(start)}`);
    lines.push(`DTEND:${formatIcsUtc(end)}`);
    lines.push(`SUMMARY:${summary}`);
    if (description.length > 0) {
      lines.push(`DESCRIPTION:${description}`);
    }
    if (location.length > 0) {
      lines.push(`LOCATION:${location}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
