/**
 * Aligné sur la doc Capacitor « Live Reload » (Framework CLIs) :
 * https://capacitorjs.com/docs/guides/live-reload
 *
 * Next en dev : `next dev -H 0.0.0.0 --webpack` — Webpack pour HMR sur la WebView Capacitor
 * (Turbopack peut ouvrir le WS HMR sur `localhost` alors que la page est en IP LAN).
 * Puis `server.url` + `cleartext` dans la config Capacitor, `cap copy`, et l’app Android
 * — ou en CLI : `cap run android --live-reload --port <port>` (voir `dev:emulator`).
 *
 * IPv4 LAN : détection auto (`os.networkInterfaces()`). Surcharge : `CAP_DEV_LAN_HOST`.
 */
import os from "node:os";

export const DEV_SERVER_PORT = 3001;

/** `false` = build / téléphone sur le LAN uniquement. */
export const USE_ANDROID_EMULATOR = true;

/**
 * URL du WebView Capacitor (HMR).
 *
 * - **`lan`** — `http://<LAN>:3001` (IP détectée ou `CAP_DEV_LAN_HOST`).
 * - **`adb-reverse`** — `http://127.0.0.1:3001` : avec `cap run android --forwardPorts 3001:3001`.
 * - **`host-alias`** — `http://10.0.2.2:3001` : émulateur sans accès LAN.
 *
 * `allowedDevOrigins` (Next) attend des **hôtes seuls** (`127.0.0.1`, pas `http://…:3001`), voir tests Next.
 */
export const EMULATOR_DEV_URL_MODE = "lan" as "lan" | "adb-reverse" | "host-alias";

function isIPv4(family: string | number): boolean {
  return family === "IPv4" || family === 4;
}

/** Préfère 192.168.x, évite souvent les `.1` (VM / passerelles) et les noms d’adaptateurs virtuels. */
function pickLanIPv4(): string {
  const skipIface = /vmware|virtualbox|vbox|wsl|hyper-v|vethernet|docker|vmnet|npcap|bluetooth|loopback|tun|tap|pseudo/i;
  type Cand = { address: string; score: number };
  const cands: Cand[] = [];
  const nets = os.networkInterfaces();

  for (const name of Object.keys(nets)) {
    if (skipIface.test(name)) continue;
    const addrs = nets[name];
    if (!addrs) continue;
    for (const addr of addrs) {
      if (!isIPv4(addr.family) || addr.internal) continue;
      if (addr.address.startsWith("169.254.")) continue;
      const a = addr.address;
      let score = 0;
      if (a.startsWith("192.168.")) score += 1000;
      else if (a.startsWith("10.")) score += 500;
      else if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(a)) score += 100;
      else score += 10;
      if (!a.endsWith(".1")) score += 50;
      cands.push({ address: a, score });
    }
  }

  cands.sort((x, y) => y.score - x.score);
  return cands[0]?.address ?? "127.0.0.1";
}

let cachedLanHost: string | undefined;
let lanHostLogged = false;

/**
 * IPv4 utilisée pour les URLs `lan` (détection auto, log une fois au premier appel).
 * Surcharge : `CAP_DEV_LAN_HOST` ou `LAN_HOST`.
 */
export function getLanHost(): string {
  const fromEnv =
    process.env["CAP_DEV_LAN_HOST"]?.trim() || process.env["LAN_HOST"]?.trim();
  if (fromEnv) {
    if (!lanHostLogged) {
      lanHostLogged = true;
      console.log(`[mobile] LAN IPv4 (CAP_DEV_LAN_HOST / LAN_HOST) : ${fromEnv}`);
    }
    return fromEnv;
  }
  if (!cachedLanHost) {
    cachedLanHost = pickLanIPv4();
    if (!lanHostLogged) {
      lanHostLogged = true;
      console.log(`[mobile] LAN IPv4 (détection auto) : ${cachedLanHost}`);
    }
  }
  return cachedLanHost;
}

/**
 * URL du serveur dev pour le WebView (live reload).
 *
 * En **`NODE_ENV === "production"`** (ex. `next build` + `cap copy`), retourne **`undefined`** :
 * le WebView charge les fichiers **packagés** depuis `webDir` (`out/`), pas une IP LAN — sinon en prod
 * l’app tente `http://192.168.x.x:3001` → *connection refused* hors réseau / serveur éteint.
 *
 * Forcer le mode dev même en prod : `CAPACITOR_DEV_SERVER=1`. Forcer les assets packagés : `CAP_USE_PACKAGED_WEB=1`.
 */
export function getCapacitorDevServerUrl(): string | undefined {
  const forceDevServer =
    process.env["CAPACITOR_DEV_SERVER"] === "1" || process.env["CAP_DEV_SERVER"] === "1";
  const forcePackaged = process.env["CAP_USE_PACKAGED_WEB"] === "1";

  if (!forceDevServer && (process.env["NODE_ENV"] === "production" || forcePackaged)) {
    return undefined;
  }

  const host = getLanHost();
  if (!USE_ANDROID_EMULATOR) {
    return `http://${host}:${DEV_SERVER_PORT}`;
  }
  switch (EMULATOR_DEV_URL_MODE) {
    case "lan":
      return `http://${host}:${DEV_SERVER_PORT}`;
    case "adb-reverse":
      return `http://127.0.0.1:${DEV_SERVER_PORT}`;
    case "host-alias":
      return `http://10.0.2.2:${DEV_SERVER_PORT}`;
    default:
      return `http://${host}:${DEV_SERVER_PORT}`;
  }
}

function hostnameFromUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  try {
    return new URL(url).hostname || undefined;
  } catch {
    return undefined;
  }
}

/** Hôtes autorisés pour le HMR / `/_next/*` en dev (pas d’URL complète ni de port). */
export function getAllowedCapDevOrigins(): string[] {
  const host = getLanHost();
  const capUrl = getCapacitorDevServerUrl();
  const capHost = hostnameFromUrl(capUrl);
  return [
    ...new Set(
      [
        "localhost",
        "127.0.0.1",
        "10.0.2.2",
        host,
        capHost,
        hostnameFromUrl(process.env["NEXT_PUBLIC_API_BASE_URL"]),
      ].filter((v): v is string => Boolean(v)),
    ),
  ];
}
