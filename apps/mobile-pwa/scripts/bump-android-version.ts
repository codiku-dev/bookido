/**
 * Incrémente VERSION_CODE dans android/version.properties (+1) avant chaque `bundleRelease`.
 *
 * VERSION_NAME : ANDROID_VERSION_NAME > version.properties > package.json ("version") > "1.0".
 *
 * Désactiver : SKIP_ANDROID_VERSION_BUMP=1. CI : ANDROID_VERSION_CODE (env) → Gradle seul, sans toucher au fichier.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function parseProps(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split(/\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return out;
}

function readPackageVersion(mobileDir: string): string | undefined {
  const pkgPath = resolve(mobileDir, "package.json");
  if (!existsSync(pkgPath)) return undefined;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
  return typeof pkg.version === "string" && pkg.version.length > 0 ? pkg.version : undefined;
}

const mobileDir = process.cwd();
const propsPath = resolve(mobileDir, "android/version.properties");

if (process.env["SKIP_ANDROID_VERSION_BUMP"] === "1") {
  console.log(
    "[bump-android-version] SKIP_ANDROID_VERSION_BUMP=1 — version.properties inchangé",
  );
  process.exit(0);
}

if (process.env["ANDROID_VERSION_CODE"] != null && process.env["ANDROID_VERSION_CODE"] !== "") {
  console.log(
    "[bump-android-version] ANDROID_VERSION_CODE défini dans l’environnement — Gradle l’utilisera ; pas d’incrément fichier",
  );
  process.exit(0);
}

let code = 1;
let nameFromFile: string | undefined;

if (existsSync(propsPath)) {
  const props = parseProps(readFileSync(propsPath, "utf8"));
  const c = Number.parseInt(props["VERSION_CODE"] ?? "", 10);
  if (!Number.isNaN(c) && c > 0) code = c;
  if (props["VERSION_NAME"] != null && props["VERSION_NAME"] !== "") {
    nameFromFile = props["VERSION_NAME"];
  }
}

const pkgVer = readPackageVersion(mobileDir);
const fromEnv = process.env["ANDROID_VERSION_NAME"]?.trim();
const versionName =
  fromEnv && fromEnv !== ""
    ? fromEnv
    : nameFromFile != null && nameFromFile !== ""
      ? nameFromFile
      : pkgVer != null && pkgVer !== ""
        ? pkgVer
        : "1.0";

const nextCode = code + 1;

const body =
  `# Incrémenté automatiquement par scripts/bump-android-version.ts avant chaque AAB release.\n` +
  `# Édite la version visible (STORE) via package.json du mobile (\"version\") ou ANDROID_VERSION_NAME.\n` +
  `VERSION_CODE=${nextCode}\n` +
  `VERSION_NAME=${versionName}\n`;

writeFileSync(propsPath, body, "utf8");

console.log(
  `[bump-android-version] VERSION_CODE ${code} → ${nextCode}, VERSION_NAME="${versionName}"`,
);
