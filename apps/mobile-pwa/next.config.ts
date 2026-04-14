// @ts-check
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "@dotenvx/dotenvx";
import { getAllowedCapDevOrigins } from "./libs/dev-server-origin";

const dir = path.dirname(fileURLToPath(import.meta.url));

function parseJavaProperties(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (t === "" || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return out;
}

function readMobilePackageVersion(root: string): string {
  try {
    const raw = readFileSync(path.join(root, "package.json"), "utf8");
    const p = JSON.parse(raw);
    return typeof p.version === "string" ? p.version : "—";
  } catch {
    return "—";
  }
}

function readPlayStoreVersions(root: string): { name: string; code: string } {
  const propsPath = path.join(root, "android", "version.properties");
  if (!existsSync(propsPath)) return { name: "—", code: "—" };
  const props = parseJavaProperties(readFileSync(propsPath, "utf8"));
  return {
    name: props["VERSION_NAME"] ?? "—",
    code: props["VERSION_CODE"] ?? "—",
  };
}

const mobilePackageVersion = readMobilePackageVersion(dir);
const playVersions = readPlayStoreVersions(dir);
if (process.env.NODE_ENV === "development") {
  loadEnv({ path: path.resolve(dir, ".env") });
  loadEnv({ path: path.resolve(dir, ".env.local.development") });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Export statique → dossier `out/` pour Capacitor (`webDir: "out"`) quand `server.url` est absent en prod. */
  output: "export",
  images: {
    unoptimized: true,
  },
  /** Uniquement en dev : évite d’exécuter la résolution LAN pendant `next build` (export statique). */
  ...(process.env["NODE_ENV"] === "development"
    ? { allowedDevOrigins: getAllowedCapDevOrigins() }
    : {}),
  transpilePackages: ["@repo/ui"],
  env: {
    NEXT_PUBLIC_MOBILE_PACKAGE_VERSION: mobilePackageVersion,
    NEXT_PUBLIC_PLAY_STORE_VERSION_NAME: playVersions.name,
    NEXT_PUBLIC_PLAY_STORE_VERSION_CODE: playVersions.code,
  },
};

export default nextConfig;
