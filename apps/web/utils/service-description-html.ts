/** Anciennes descriptions plain-text → un paragraphe HTML pour TipTap. */
export function normalizeServiceDescriptionHtml(raw: string): string {
  const t = raw.trim();
  if (t.length === 0) {
    return "<p></p>";
  }
  if (t.startsWith("<")) {
    return t;
  }
  const esc = t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${esc}</p>`;
}
