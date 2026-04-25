import { z } from "zod";

export const dayHoursSchema = z.object({
  enabled: z.boolean(),
  startTime: z.string(),
  endTime: z.string(),
});

export const weekHoursSchema = z.object({
  Monday: dayHoursSchema,
  Tuesday: dayHoursSchema,
  Wednesday: dayHoursSchema,
  Thursday: dayHoursSchema,
  Friday: dayHoursSchema,
  Saturday: dayHoursSchema,
  Sunday: dayHoursSchema,
});

const slotKeyRegex = /^(sun|mon|tue|wed|thu|fri|sat)-\d{2}:\d{2}$/;

export const calendarAvailabilityOutputSchema = z.object({
  weekHours: weekHoursSchema,
  closedSlotKeys: z.array(z.string().regex(slotKeyRegex)),
});

export const updateCalendarAvailabilityInputSchema = z.object({
  weekHours: weekHoursSchema,
  closedSlotKeys: z.array(z.string().regex(slotKeyRegex)),
});

export type WeekHoursInput = z.infer<typeof weekHoursSchema>;

export const publicBookingSlugSchema = z
  .string()
  .min(2)
  .max(96)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "INVALID_SLUG_FORMAT");

/** Max stored string length (~8 MiB) for a data URL from a ~5 MiB binary file. */
export const PROFILE_AVATAR_DATA_URL_MAX_LEN = 8_388_608;

export const updateProfileAvatarInputSchema = z.object({
  /** `null` or `""` removes the avatar; otherwise a `data:image/...` URL or short HTTPS URL. */
  image: z
    .union([z.literal(""), z.string().min(1).max(PROFILE_AVATAR_DATA_URL_MAX_LEN)])
    .nullable(),
});

export type UpdateProfileAvatarInput = z.infer<typeof updateProfileAvatarInputSchema>;

export const publicBookingPresenceOutputSchema = z.object({
  publicBookingSlug: z.string().nullable(),
  image: z.string().nullable(),
  defaultAddress: z.string().nullable(),
  publicBookingMinNoticeHours: z.number().int().min(0).max(168),
});

export const updatePublicBookingPresenceInputSchema = z.object({
  publicBookingSlug: z.union([publicBookingSlugSchema, z.literal("")]).optional(),
});

export type UpdatePublicBookingPresenceInput = z.infer<typeof updatePublicBookingPresenceInputSchema>;

export const updateProfileBasicsInputSchema = z.object({
  name: z.string().min(1).max(200),
  bio: z.string().max(4000).nullable().optional(),
  defaultAddress: z.string().max(500).nullable().optional(),
  publicBookingMinNoticeHours: z.number().int().min(0).max(168).optional(),
});

export type UpdateProfileBasicsInput = z.infer<typeof updateProfileBasicsInputSchema>;
