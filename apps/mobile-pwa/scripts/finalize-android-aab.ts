import { finalizeAndroidAab, logFinalizedAab } from "./android-aab-artifact";

const mobileDir = process.cwd();
const paths = finalizeAndroidAab(mobileDir);
logFinalizedAab(paths);
