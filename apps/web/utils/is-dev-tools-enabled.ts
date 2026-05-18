/** Dev fill, debugger panel, Stripe simulation — local dev and staging deploys only. */
export function isDevToolsEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env["NEXT_PUBLIC_APP_ENV"] === "staging"
  );
}
