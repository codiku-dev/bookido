/**
 * Valeurs / helpers dupliqués depuis l’API pour que `server.ts` (généré) typecheck
 * sans dépendre de `apps/api`. À garder alignés avec :
 * - `apps/api/src/features/profile/profile.schema.ts`
 * - `apps/api/src/utils/rich-text-plain.ts`
 * - `apps/api/src/features/services/service-limits.ts`
 */
import { z } from "zod";

export const publicBookingSlugSchema = z
  .string()
  .min(2)
  .max(96)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "INVALID_SLUG_FORMAT");

export const PROFILE_AVATAR_DATA_URL_MAX_LEN = 8_388_608;

export const SERVICE_DESCRIPTION_MAX_CHARS = 1000;

/** Extrait un texte lisible à partir de HTML (validation côté schéma). */
export function plainTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
