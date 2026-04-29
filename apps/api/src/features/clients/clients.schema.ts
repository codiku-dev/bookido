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

export const listClientsPaginatedInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.union([z.literal(25), z.literal(50), z.literal(100)]).default(25),
  search: z.string().trim().max(200).optional(),
  nextBookingFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nextBookingTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const paginatedClientsOutputSchema = z.object({
  items: z.array(clientWithStatsSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.union([z.literal(25), z.literal(50), z.literal(100)]),
  totalPages: z.number().int().min(1),
});

export type ClientWithStats = z.infer<typeof clientWithStatsSchema>;
export type CreateClientInput = z.infer<typeof createClientInputSchema>;
export type UpdateClientInput = z.infer<typeof updateClientInputSchema>;
export type ListClientsPaginatedInput = z.infer<typeof listClientsPaginatedInputSchema>;

export function withPlaceholderStats<T extends z.infer<typeof clientBaseSchema>>(row: T): ClientWithStats {
  return {
    ...row,
    ...emptyStats,
  };
}
