import { z } from "zod";

import { weekHoursSchema } from "../profile/profile.schema";
import { bookingOutputSchema } from "../bookings/bookings.schema";

import { publicBookingSlugSchema } from "../profile/profile.schema";

export const publicBookingGetStorefrontInputSchema = z.object({
  coachSlug: publicBookingSlugSchema,
  rangeFrom: z.string().datetime(),
  rangeTo: z.string().datetime(),
});

export const publicBookingBookingSegmentSchema = z.object({
  startsAt: z.string().datetime(),
  durationMinutes: z.number().int(),
  status: z.string(),
});

export const publicServiceCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable(),
  durationMinutes: z.number().int(),
  price: z.number(),
  isFree: z.boolean(),
  requiresValidation: z.boolean(),
});

export const publicBookingCoachCardSchema = z.object({
  name: z.string(),
  bio: z.string().nullable(),
  imageUrl: z.string().nullable(),
});

export const publicBookingGetStorefrontOutputSchema = z.object({
  coach: publicBookingCoachCardSchema,
  weekHours: weekHoursSchema,
  closedSlotKeys: z.array(z.string()),
  services: z.array(publicServiceCardSchema),
  bookingSegments: z.array(publicBookingBookingSegmentSchema),
});

export const publicBookingRequestInputSchema = z.object({
  coachSlug: publicBookingSlugSchema,
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime(),
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email().max(320),
  clientPhone: z.string().max(80).optional(),
});

export type PublicBookingGetStorefrontInput = z.infer<typeof publicBookingGetStorefrontInputSchema>;
export type PublicBookingRequestInput = z.infer<typeof publicBookingRequestInputSchema>;

export const publicBookingRequestOutputSchema = bookingOutputSchema;
