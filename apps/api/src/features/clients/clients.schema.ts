import { z } from "zod";

const emptyStats = {
  totalBookings: 0,
  totalSpent: 0,
  status: "active" as const,
  lastBooking: null,
  nextBookingDate: null,
  nextBookingService: null,
};

export const clientBaseSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const clientWithStatsSchema = clientBaseSchema.extend({
  totalBookings: z.number(),
  totalSpent: z.number(),
  status: z.enum(["active", "inactive"]),
  lastBooking: z.string().nullable(),
  nextBookingDate: z.string().nullable(),
  nextBookingService: z.string().nullable(),
});

export const createClientInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const updateClientInputSchema = createClientInputSchema.partial();

export type ClientWithStats = z.infer<typeof clientWithStatsSchema>;
export type CreateClientInput = z.infer<typeof createClientInputSchema>;
export type UpdateClientInput = z.infer<typeof updateClientInputSchema>;

export function withPlaceholderStats<T extends z.infer<typeof clientBaseSchema>>(row: T): ClientWithStats {
  return {
    ...row,
    ...emptyStats,
  };
}
