/** Dev headers (e.g. simulate Stripe ready) — local dev and staging deploys only. */
export function isDevToolsEnabled(): boolean {
  return (
    process.env["NODE_ENV"] === "development" ||
    process.env["APP_ENV"] === "staging"
  );
}
