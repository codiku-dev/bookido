/* eslint-disable @typescript-eslint/no-namespace -- matches apps/web ProcessEnv augmentation */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import { z } from "zod";

export const envSchema = z.object({
  /** IP LAN du PC pour dev (réécriture de localhost côté app native). */
  NEXT_PUBLIC_LAN_HOST: z.string().optional(),
  NEXT_PUBLIC_API_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_AUTH_CALLBACK_URL: z.string().optional(),

  // Google Play credentials
  GOOGLE_PLAY_TYPE: z.string(),
  GOOGLE_PLAY_PROJECT_ID: z.string(),
  GOOGLE_PLAY_PRIVATE_KEY_ID: z.string(),
  GOOGLE_PLAY_PRIVATE_KEY: z.string(),
  GOOGLE_PLAY_CLIENT_EMAIL: z.string(),
  GOOGLE_PLAY_CLIENT_ID: z.string(),
  GOOGLE_PLAY_AUTH_URI: z.string(),
  GOOGLE_PLAY_TOKEN_URI: z.string(),
  GOOGLE_PLAY_AUTH_PROVIDER_X509_CERT_URL: z.string(),
  GOOGLE_PLAY_CLIENT_X509_CERT_URL: z.string(),
  GOOGLE_PLAY_UNIVERSE_DOMAIN: z.string(),
});

export type Env = z.infer<typeof envSchema>;

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env { }
  }
}

export function parseEnv(): Env {
  return envSchema.parse(process.env);
}
