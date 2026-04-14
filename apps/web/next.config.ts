// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "@dotenvx/dotenvx";
import createNextIntlPlugin from "next-intl/plugin";

// Next.js only loads standard .env* names; load all .env* so NEXT_PUBLIC_* are available.
const dir = path.dirname(fileURLToPath(import.meta.url));
if (process.env.NODE_ENV === 'development') {
  loadEnv({ path: path.resolve(dir, '.env') });
}

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [process.env["NEXT_PUBLIC_API_BASE_URL"] as string],
  transpilePackages: ['@repo/ui'],
};

export default withNextIntl(nextConfig);
