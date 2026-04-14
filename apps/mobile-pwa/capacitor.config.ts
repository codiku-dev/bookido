import type { CapacitorConfig } from "@capacitor/cli";
import { getCapacitorDevServerUrl } from "./libs/dev-server-origin";

const devServerUrl = getCapacitorDevServerUrl();

const config: CapacitorConfig = {
  appId: "com.bangerstack.mobile",
  appName: "BangerStack",
  webDir: "out",
  plugins: {
    /** Works with `viewportFit: 'cover'` so the WebView parent is not padded like the status bar is still there. */
    SystemBars: {
      hidden: true,
      insetsHandling: "disable",
    },
  },
  android: {
    allowMixedContent: true,
  },
  ...(devServerUrl
    ? {
      server: {
        url: devServerUrl,
        cleartext: true,
      },
    }
    : {}),
};

export default config;
