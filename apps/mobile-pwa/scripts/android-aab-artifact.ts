import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/** Default Gradle output for `bundleRelease` (app module). */
export function defaultAndroidAabPath(mobileDir: string): string {
  return resolve(mobileDir, "android/app/build/outputs/bundle/release/app-release.aab");
}

export type FinalizedAab = {
  builtPath: string;
  /** Same file copied next to `package.json` under `mobileDir`. */
  mobilePackagePath: string;
};

/** Copy release AAB to the mobile project root (`mobileDir`) as `app-release.aab`. */
export function finalizeAndroidAab(mobileDir: string): FinalizedAab {
  const builtPath = defaultAndroidAabPath(mobileDir);
  if (!existsSync(builtPath)) {
    throw new Error(
      `AAB not found at ${builtPath}. Run ./gradlew bundleRelease from android/ first.`,
    );
  }
  const mobilePackagePath = resolve(mobileDir, "app-release.aab");
  copyFileSync(builtPath, mobilePackagePath);
  return { builtPath, mobilePackagePath };
}

export function logFinalizedAab(p: FinalizedAab): void {
  console.log("\nAndroid App Bundle (Gradle output):");
  console.log(`  ${p.builtPath}`);
  console.log("\nCopied to mobile project root:");
  console.log(`  ${p.mobilePackagePath}`);
}
