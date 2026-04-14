import {
  existsSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  mkdtempSync,
  mkdirSync,
  chmodSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { config } from "dotenv";
import { finalizeAndroidAab, logFinalizedAab } from "./android-aab-artifact";

type Step = {
  name: string;
  command: string;
  cwd: string;
};

function inferPackageName(p: { mobileDir: string; androidDir: string }): string {
  const capConfigPath = resolve(p.mobileDir, "capacitor.config.ts");
  if (existsSync(capConfigPath)) {
    const content = readFileSync(capConfigPath, "utf8");
    const appIdMatch = content.match(/appId:\s*"([^"]+)"/);
    if (appIdMatch?.[1]) return appIdMatch[1];
  }

  const gradlePath = resolve(p.androidDir, "app/build.gradle");
  if (existsSync(gradlePath)) {
    const content = readFileSync(gradlePath, "utf8");
    const appIdMatch = content.match(/applicationId\s+"([^"]+)"/);
    if (appIdMatch?.[1]) return appIdMatch[1];
    const namespaceMatch = content.match(/namespace\s+"([^"]+)"/);
    if (namespaceMatch?.[1]) return namespaceMatch[1];
  }

  throw new Error(
    "Unable to infer Android package name from capacitor.config.ts or android/app/build.gradle",
  );
}

function runStep(p: Step): Promise<void> {
  return new Promise((resolveStep, rejectStep) => {
    console.log(`\n==> ${p.name}`);
    const child = spawn(p.command, {
      cwd: p.cwd,
      stdio: "inherit",
      shell: true,
      env: process.env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolveStep();
        return;
      }
      rejectStep(new Error(`${p.name} failed with exit code ${code ?? 1}`));
    });
  });
}

function createGooglePlayJsonFromSplitEnv(p: { mobileDir: string }): string | null {
  const privateKey = process.env["GOOGLE_PLAY_PRIVATE_KEY"];
  const clientEmail = process.env["GOOGLE_PLAY_CLIENT_EMAIL"];

  if (
    privateKey == null ||
    privateKey.trim() === "" ||
    clientEmail == null ||
    clientEmail.trim() === ""
  ) {
    return null;
  }

  const normalizedPrivateKey = privateKey
    .trim()
    .replace(/^"(.*)"$/s, "$1")
    .replace(/^'(.*)'$/s, "$1")
    .replace(/\\n/g, "\n");

  const credentials = {
    type: process.env["GOOGLE_PLAY_TYPE"] ?? "service_account",
    project_id: process.env["GOOGLE_PLAY_PROJECT_ID"] ?? "",
    private_key_id: process.env["GOOGLE_PLAY_PRIVATE_KEY_ID"] ?? "",
    private_key: normalizedPrivateKey,
    client_email: clientEmail,
    client_id: process.env["GOOGLE_PLAY_CLIENT_ID"] ?? "",
    auth_uri: process.env["GOOGLE_PLAY_AUTH_URI"] ?? "https://accounts.google.com/o/oauth2/auth",
    token_uri: process.env["GOOGLE_PLAY_TOKEN_URI"] ?? "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url:
      process.env["GOOGLE_PLAY_AUTH_PROVIDER_X509_CERT_URL"] ??
      "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env["GOOGLE_PLAY_CLIENT_X509_CERT_URL"] ?? "",
    universe_domain: process.env["GOOGLE_PLAY_UNIVERSE_DOMAIN"] ?? "googleapis.com",
  };

  const tempDir = mkdtempSync(resolve(tmpdir(), "bangerstack-play-"));
  const tempPath = resolve(tempDir, "google-play.json");
  writeFileSync(tempPath, JSON.stringify(credentials), {
    encoding: "utf8",
    mode: 0o600,
  });
  console.log("Using Google Play split credentials from .env");
  return tempPath;
}

function ensureCapacitorAndroidAssetsDir(p: { androidDir: string }): void {
  const assetsDir = resolve(p.androidDir, "app/src/main/assets");
  mkdirSync(assetsDir, { recursive: true });
}

function ensureGradlewIsExecutable(p: { androidDir: string }): void {
  const gradlewPath = resolve(p.androidDir, "gradlew");
  const gradlewStats = statSync(gradlewPath);
  if ((gradlewStats.mode & 0o111) === 0) {
    chmodSync(gradlewPath, gradlewStats.mode | 0o755);
  }
}

async function main() {
  const mobileDir = process.cwd();
  const androidDir = resolve(mobileDir, "android");
  config({ path: resolve(mobileDir, ".env") });
  ensureCapacitorAndroidAssetsDir({ androidDir });
  ensureGradlewIsExecutable({ androidDir });

  const tempKeyPath = createGooglePlayJsonFromSplitEnv({ mobileDir });
  const keyPath = tempKeyPath ?? resolve(mobileDir, "google-play.json");

  const packageName =
    process.env["ANDROID_PACKAGE_NAME"] != null &&
      process.env["ANDROID_PACKAGE_NAME"] !== ""
      ? process.env["ANDROID_PACKAGE_NAME"]
      : inferPackageName({ mobileDir, androidDir });
  const track = process.env["PLAY_TRACK"] ?? "internal";
  /**
   * `completed` = la release est publiée sur la piste (test interne, production, etc.) sans action manuelle
   * dans la console pour le statut de la release.
   * Si l’API répond que l’app est encore une « draft app », utiliser `PLAY_RELEASE_STATUS=draft` puis valider une fois dans Play Console.
   */
  const fromEnvPlayRelease = process.env["PLAY_RELEASE_STATUS"]?.trim();
  const releaseStatus =
    fromEnvPlayRelease && fromEnvPlayRelease !== ""
      ? fromEnvPlayRelease
      : "completed";
  const aabPath = resolve(
    androidDir,
    "app/build/outputs/bundle/release/app-release.aab",
  );

  if (!existsSync(keyPath)) {
    throw new Error(`Google Play JSON key not found at: ${keyPath}`);
  }

  console.log(
    `Play upload: track=${track}, release_status=${releaseStatus}${releaseStatus === "draft" ? "" : " (publication automatique sur la piste)"}. Si erreur « draft app », définir PLAY_RELEASE_STATUS=draft.`,
  );

  const steps: Step[] = [
    {
      name: "Build mobile web app",
      command: "bun run build",
      cwd: mobileDir,
    },
    {
      name: "Sync Capacitor Android",
      command: "NODE_ENV=production npx @capacitor/cli sync android",
      cwd: mobileDir,
    },
    {
      name: "Bump Android version (versionCode)",
      command: "bun run scripts/bump-android-version.ts",
      cwd: mobileDir,
    },
    {
      name: "Build Android release AAB",
      command: "./gradlew bundleRelease",
      cwd: androidDir,
    },
    {
      name: "Upload AAB to Google Play",
      command: `fastlane run upload_to_play_store track:${track} package_name:${packageName} aab:${aabPath} json_key:${keyPath} release_status:${releaseStatus}`,
      cwd: androidDir,
    },
  ];

  try {
    for (const step of steps) {
      await runStep(step);
      if (step.name === "Build Android release AAB") {
        const paths = finalizeAndroidAab(mobileDir);
        logFinalizedAab(paths);
      }
    }
  } finally {
    if (tempKeyPath != null && existsSync(tempKeyPath)) {
      unlinkSync(tempKeyPath);
    }
  }

  console.log("\n✅ Android release publiée sur Google Play.");
  console.log(`Track: ${track}`);
  console.log(`Package: ${packageName}`);
  console.log(
    `Statut release: ${releaseStatus} — si la console a « Publication gérée » activée, une validation manuelle peut encore être requise dans Play Console.`,
  );
}

main().catch((error: unknown) => {
  console.error("\n❌ Android release failed.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
});
