/**
 * Generated from .env.production. 
 */
import { config } from "@dotenvx/dotenvx";
import { z } from "zod";
import { resolve } from "node:path";

export const envSchema = z.object({
  PORT: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_PORT: z.string(),
  POSTGRES_USER: z.string(),
  DATABASE_URL: z.string(),
  BETTER_AUTH_SECRET: z.string(),
  AUTH_GOOGLE_CLIENT_ID: z.string(),
  AUTH_GOOGLE_CLIENT_SECRET: z.string(),
  FRONTEND_URL: z.string().optional(),
  /** Next mobile depuis le navigateur sur le PC (souvent localhost:3001). */
  MOBILE_URL_WEB: z.string().optional(),
  /** Next mobile chargé depuis l’émulateur (souvent 10.0.2.2:3001). */
  MOBILE_URL_EMULATOR: z.string().optional(),
  /** Next mobile sur le LAN (ex. http://192.168.x.x:3001) — doit matcher l’`Origin` réelle. */
  MOBILE_URL_LAN: z.string().optional(),
  BETTER_AUTH_URL: z.string(),
  //EMAIL
  EMAIL_SMTP_PASSWORD: z.string(),
  EMAIL_SMTP_HOST: z.string(),
  EMAIL_SMTP_PORT: z.string(),
  EMAIL_SMTP_USER: z.string(),
  APP_NAME: z.string(),
  STRIPE_PUBLISHABLE_KEY:z.string(),
  STRIPE_SECRET_KEY:z.string(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

});

export type Env = z.infer<typeof envSchema>;

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env { }
  }
}

export function parseEnv(): Env {
  // En dev on charge .env ; en prod l’env est déjà injecté par dotenvx run -f .env.production
  if (process.env['NODE_ENV'] === 'development') {
    config({ path: resolve(process.cwd(), '.env') });
  }
  return envSchema.parse(process.env);
}
