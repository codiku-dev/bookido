import { z } from "zod";

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
  requiresValidation: z.boolean(),
  allowsDirectPayment: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().trim().min(1),
  durationMinutes: z.number().int().positive(),
  price: z.number().nonnegative(),
  isFree: z.boolean(),
  packSize: z.number().int().min(1),
  imageUrl: z.string().nullable().optional(),
  address: z.string().trim().min(1).max(500),
  availableSlotKeys: z.array(z.string()),
  requiresValidation: z.boolean(),
  allowsDirectPayment: z.boolean(),
});

export const updateServiceSchema = createServiceSchema.partial();
