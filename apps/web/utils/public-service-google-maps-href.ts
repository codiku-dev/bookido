export function addressToGoogleMapsSearchHref(address: string): string {
  const trimmed = address.trim();
  if (trimmed.length === 0) {
    return "";
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}
