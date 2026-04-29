import { z } from "zod";

import { SERVICE_DESCRIPTION_MAX_CHARS } from "./service-limits";

/** Matches 30-minute calendar grid; minimum one slot. */
export const serviceDurationMinutesSchema = z
  .number()
  .int()
  .min(30, { message: "DURATION_MINUTES_MIN_30" })
  .refine((n) => n % 30 === 0, { message: "DURATION_MINUTES_MULTIPLE_30" });

export const serviceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string(),
  durationMinutes: z.number().int(),
  price: z.number(),
  isFree: z.boolean(),
  packSize: z.number().int(),
  imageUrl: z.string().nullable(),
  address: z.string(),
  availableSlotKeys: z.array(z.string()),
  isPublished: z.boolean(),
  requiresValidation: z.boolean(),
  allowsDirectPayment: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().trim().min(1).max(SERVICE_DESCRIPTION_MAX_CHARS),
  durationMinutes: serviceDurationMinutesSchema,
  price: z.number().nonnegative(),
  isFree: z.boolean(),
  packSize: z.number().int().min(1),
  imageUrl: z.string().nullable().optional(),
  address: z.string().trim().min(1).max(500),
  availableSlotKeys: z.array(z.string()),
  isPublished: z.boolean().optional(),
  requiresValidation: z.boolean(),
  allowsDirectPayment: z.boolean(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const listServicesPaginatedInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.union([z.literal(25), z.literal(50), z.literal(100)]).default(25),
  search: z.string().trim().max(200).optional(),
  published: z.union([z.literal("published"), z.literal("draft")]).optional(),
  payment: z.union([z.literal("card"), z.literal("direct")]).optional(),
  durationMinutes: z.number().int().positive().optional(),
  priceMin: z.number().nonnegative().optional(),
  priceMax: z.number().nonnegative().optional(),
});

export const paginatedServicesOutputSchema = z.object({
  items: z.array(serviceSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.union([z.literal(25), z.literal(50), z.literal(100)]),
  totalPages: z.number().int().min(1),
});
