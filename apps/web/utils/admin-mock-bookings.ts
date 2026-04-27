export type AdminBookingStatus = "confirmed" | "pending" | "cancelled";

export type AdminPaymentStatus = "paid" | "unpaid" | "partial";

export type AdminBookingRecord = {
  id: number;
  client: string;
  service: string;
  date: string;
  time: string;
  durationMinutes: number;
  amount: number;
  /** Cumulative amount already received (same currency as `amount`). */
  paidAmount: number;
  payment: AdminPaymentStatus;
  status: AdminBookingStatus;
  clientUserId: number;
  clientEmail: string;
  clientPhone: string;
  location: string;
  notes: string;
  paymentMethod: string;
  requiresHostValidation: boolean;
  hostValidationAccepted: boolean;
  /** Mirrors the service setting: client can pay on-site / direct. */
  allowsDirectPayment: boolean;
};

const STORAGE_KEY = "bookido-admin-mock-bookings-v1";

const seedBookings: AdminBookingRecord[] = [
  {
    id: 1,
    client: "Marie Dupont",
    service: "Coaching Personnel 1-on-1",
    date: "2026-04-14",
    time: "09:00",
    durationMinutes: 60,
    amount: 50,
    paidAmount: 50,
    payment: "paid",
    status: "confirmed",
    clientUserId: 1,
    clientEmail: "marie@example.com",
    clientPhone: "+33 6 12 34 56 78",
    location: "Salle de sport principale",
    notes: "Cliente préfère les exercices de cardio. Objectif : perte de poids.",
    paymentMethod: "Carte bancaire",
    requiresHostValidation: false,
    hostValidationAccepted: true,
    allowsDirectPayment: false,
  },
  {
    id: 2,
    client: "Pierre Martin",
    service: "Coaching Nutrition",
    date: "2026-04-14",
    time: "14:00",
    durationMinutes: 60,
    amount: 40,
    paidAmount: 40,
    payment: "paid",
    status: "confirmed",
    clientUserId: 2,
    clientEmail: "pierre.martin@example.com",
    clientPhone: "+33 6 98 76 54 32",
    location: "Visio",
    notes: "Premier bilan alimentaire.",
    paymentMethod: "Carte bancaire",
    requiresHostValidation: false,
    hostValidationAccepted: true,
    allowsDirectPayment: false,
  },
  {
    id: 3,
    client: "Sophie Bernard",
    service: "Pack 5 Sessions",
    date: "2026-04-15",
    time: "10:00",
    durationMinutes: 60,
    amount: 200,
    paidAmount: 0,
    payment: "unpaid",
    status: "pending",
    clientUserId: 3,
    clientEmail: "sophie.bernard@example.com",
    clientPhone: "+33 6 11 22 33 44",
    location: "Studio centre-ville",
    notes: "Pack acheté en promotion — en attente de validation.",
    paymentMethod: "Virement",
    requiresHostValidation: true,
    hostValidationAccepted: false,
    allowsDirectPayment: true,
  },
  {
    id: 4,
    client: "Lucas Petit",
    service: "Monthly Training Plan",
    date: "2026-04-16",
    time: "15:00",
    durationMinutes: 60,
    amount: 180,
    paidAmount: 0,
    payment: "unpaid",
    status: "cancelled",
    clientUserId: 4,
    clientEmail: "lucas.petit@example.com",
    clientPhone: "+33 6 55 66 77 88",
    location: "—",
    notes: "Annulé par le client.",
    paymentMethod: "—",
    requiresHostValidation: false,
    hostValidationAccepted: true,
    allowsDirectPayment: false,
  },
];

function normalizeBookingRow(row: AdminBookingRecord): AdminBookingRecord {
  const paidRaw =
    typeof row.paidAmount === "number" && !Number.isNaN(row.paidAmount)
      ? row.paidAmount
      : row.payment === "paid"
        ? row.amount
        : 0;
  const paidAmount = Math.min(row.amount, Math.max(0, paidRaw));
  let payment: AdminPaymentStatus;
  if (paidAmount >= row.amount) payment = "paid";
  else if (paidAmount > 0) payment = "partial";
  else payment = "unpaid";
  return {
    ...row,
    paidAmount,
    payment,
    allowsDirectPayment: Boolean(row.allowsDirectPayment),
  };
}

export function getBookingAmountRemaining(booking: AdminBookingRecord): number {
  const normalized = normalizeBookingRow(booking);
  return Math.round(Math.max(0, normalized.amount - normalized.paidAmount) * 100) / 100;
}

export function getSeedAdminBookings(): AdminBookingRecord[] {
  return structuredClone(seedBookings).map(normalizeBookingRow);
}

export function loadAdminBookingsFromSession(): AdminBookingRecord[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return (parsed as AdminBookingRecord[]).map(normalizeBookingRow);
  } catch {
    return null;
  }
}

export function saveAdminBookingsToSession(rows: AdminBookingRecord[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows.map(normalizeBookingRow)));
}

export function readAdminBookings(): AdminBookingRecord[] {
  const rows = loadAdminBookingsFromSession() ?? getSeedAdminBookings();
  return rows.map(normalizeBookingRow);
}

export function getAdminBookingById(rows: AdminBookingRecord[], id: number): AdminBookingRecord | undefined {
  const found = rows.find((b) => b.id === id);
  return found ? normalizeBookingRow(found) : undefined;
}

export function replaceAdminBooking(
  rows: AdminBookingRecord[],
  id: number,
  patch: Partial<AdminBookingRecord>,
): AdminBookingRecord[] {
  return rows.map((b) => (b.id === id ? normalizeBookingRow({ ...b, ...patch }) : normalizeBookingRow(b)));
}
