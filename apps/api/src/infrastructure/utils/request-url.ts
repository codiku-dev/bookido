/**
 * Build the base URL from the request (protocol + host).
 * Uses X-Forwarded-Proto / X-Forwarded-Host when behind a proxy (e.g. CI).
 */
export function getBaseUrl(req: {
  protocol?: string;
  get?: (name: string) => string | undefined;
}): string {
  const protocol = req.get?.('x-forwarded-proto') || req.protocol || 'http';
  const host = req.get?.('x-forwarded-host') || req.get?.('host') || '';
  return `${protocol}://${host}`.replace(/\/$/, '');
}
