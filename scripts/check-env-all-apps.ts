/**
 * At start: parse each app's env-type.ts zod schema against process.env.
 * Loads .env from app dir if present (dev), else uses process.env (CI).
 * If any fails → "Missing env variable X, Y in apps/api", exit 1.
 *
 * Run: bun run scripts/check-env-all-apps.ts
 */

import { config } from "@dotenvx/dotenvx";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".git"]);
const ENV_FILES = [".env.production", ".env"] as const;

function collectDirs(dir: string, out: string[]): void {
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || SKIP_DIRS.has(e.name)) continue;
      collectDirs(path.join(dir, e.name), out);
    }
  } catch {
    return;
  }
  out.push(dir);
}

function loadEnvInDir(dir: string): void {
  for (const name of ENV_FILES) {
    const file = path.join(dir, name);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      config({ path: file });
      return;
    }
  }
}

(async () => {
  const dirs: string[] = [];
  collectDirs(ROOT, dirs);
  for (const dir of dirs) {
    const envTypePath = path.join(dir, "env-type.ts");
    if (!fs.existsSync(envTypePath)) continue;

    loadEnvInDir(dir);
    const appName = path.relative(ROOT, dir);
    try {
      const mod = await import(pathToFileURL(envTypePath).href);
      mod.parseEnv();
    } catch (err: unknown) {
      const issues = (err as { issues?: Array<{ path?: (string | number)[] }> })?.issues;
      const paths = issues
        ? issues
            .map((i) => i.path?.filter(Boolean).join("."))
            .filter((s): s is string => Boolean(s))
        : [];
      const vars = issues?.length
        ? paths.filter((p, i) => paths.indexOf(p) === i)
        : ["?"];
      console.error("\n❌ Environment variables validation failed\n");
      console.error(`  App: ${appName}`);
      console.error(`  Missing: ${vars.join(", ")}\n`);
      process.exit(1);
    }
  }
})();
