import { z } from "zod";

export const bookingStatusSchema = z.enum(["confirmed", "pending", "cancelled"]);

export const bookingOutputSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  clientId: z.string(),
  serviceId: z.string(),
  startsAt: z.coerce.date(),
  durationMinutes: z.number().int(),
  price: z.number(),
  paidAmount: z.number(),
  status: bookingStatusSchema,
  notes: z.string().nullable(),
  location: z.string(),
  paymentMethod: z.string(),
  requiresHostValidation: z.boolean(),
  hostValidationAccepted: z.boolean(),
  createdByClient: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  clientName: z.string(),
  clientEmail: z.string(),
  clientPhone: z.string(),
  serviceName: z.string(),
  allowsDirectPayment: z.boolean(),
});

export const listBookingsInputSchema = z.object({
  rangeFrom: z.string().datetime().optional(),
  rangeTo: z.string().datetime().optional(),
});

export const markBookingsListViewedInputSchema = z.object({});

export const createBookingInputSchema = z.object({
  clientId: z.string(),
  serviceId: z.string(),
  startsAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
  paidAmount: z.number().nonnegative().optional(),
  status: bookingStatusSchema,
  notes: z.string().optional(),
  location: z.string().optional(),
  paymentMethod: z.string().optional(),
  /** Set true only from client-facing booking APIs; admin UI must omit (defaults to false). */
  createdByClient: z.boolean().optional(),
});

export const updateBookingInputSchema = z.object({
  status: bookingStatusSchema.optional(),
  paidAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  startsAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().positive().optional(),
  hostValidationAccepted: z.boolean().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingInputSchema>;
export type ListBookingsInput = z.infer<typeof listBookingsInputSchema>;
export type MarkBookingsListViewedInput = z.infer<typeof markBookingsListViewedInputSchema>;
