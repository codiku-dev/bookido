import { z } from "zod";
import { SERVICE_DESCRIPTION_MAX_CHARS } from "#/utils/service-description-limit";
import { normalizeServiceDescriptionHtml } from "#/utils/service-description-html";
import { plainTextFromHtml } from "#/utils/rich-text-plain";

export const SERVICE_FORM_TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
] as const;

export const serviceFormDayKeyToWeekdayName = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
} as const;

export function getServiceFormSlotKey(dayKey: string, time: string) {
  return `${dayKey}-${time}`;
}

export function serviceFormTimeToMinutes(timeValue: string) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function publicBookingSlugLooksValid(slug: string) {
  return slug.length >= 2 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug);
}

export type ServiceFormSchemaMessages = {
  nameRequired: string;
  descriptionRequired: string;
  descriptionMax: string;
  addressRequired: string;
  durationNumber: string;
  durationMin30: string;
  durationMultipleOf30: string;
  packSizeNumber: string;
  packSizePositive: string;
  priceNumber: string;
  priceNonNegative: string;
  imageInvalidType: string;
};

export function buildServiceFormSchema(p: ServiceFormSchemaMessages) {
  const normalizedNumeric = z.union([z.string(), z.number()]).transform((value) => String(value).trim());

  return z.object({
    name: z.string().min(1, p.nameRequired),
    description: z.string().superRefine((val, ctx) => {
      const normalized = normalizeServiceDescriptionHtml(val);
      const plain = plainTextFromHtml(normalized);
      if (plain.length < 1) {
        ctx.addIssue({ code: "custom", message: p.descriptionRequired });
      }
      if (plain.length > SERVICE_DESCRIPTION_MAX_CHARS) {
        ctx.addIssue({ code: "custom", message: p.descriptionMax });
      }
    }),
    duration: normalizedNumeric
      .refine((value) => value.length > 0, p.durationNumber)
      .refine((value) => /^\d+$/.test(value), p.durationNumber)
      .refine((value) => {
        const n = Number.parseInt(value, 10);
        return !Number.isNaN(n) && n >= 30;
      }, p.durationMin30)
      .refine((value) => {
        const n = Number.parseInt(value, 10);
        return !Number.isNaN(n) && n % 30 === 0;
      }, p.durationMultipleOf30),
    packSize: normalizedNumeric
      .refine((value) => value.length > 0, p.packSizeNumber)
      .refine((value) => /^\d+$/.test(value), p.packSizeNumber)
      .refine((value) => Number.parseInt(value, 10) >= 1, p.packSizePositive),
    price: normalizedNumeric
      .refine((value) => value.length > 0, p.priceNumber)
      .refine((value) => /^\d+(?:[.,]\d+)?$/.test(value), p.priceNumber)
      .refine((value) => Number.parseFloat(value.replace(",", ".")) >= 0, p.priceNonNegative),
    isFree: z.boolean(),
    imageUrl: z.string().refine(
      (value) => {
        const trimmed = value.trim();
        if (trimmed.length === 0) return true;
        if (trimmed.startsWith("data:image/")) return true;
        return trimmed.startsWith("https://") || trimmed.startsWith("http://");
      },
      { message: p.imageInvalidType },
    ),
    address: z.string().trim().min(1, p.addressRequired).max(500),
    addressFromPlaces: z.boolean(),
    requiresValidation: z.boolean(),
    allowsDirectPayment: z.boolean(),
    isPublished: z.boolean(),
    availableSlotKeys: z.array(z.string()),
  });
}

export type ServiceFormValues = z.infer<ReturnType<typeof buildServiceFormSchema>>;

export function getServiceFormDefaults(): ServiceFormValues {
  return {
    name: "",
    description: "",
    duration: "60",
    packSize: "1",
    price: "0",
    isFree: false,
    imageUrl: "",
    address: "",
    addressFromPlaces: false,
    requiresValidation: false,
    allowsDirectPayment: false,
    isPublished: true,
    availableSlotKeys: [],
  };
}

export function mapExistingServiceToFormValues(service: {
  name: string;
  description: string;
  durationMinutes: number;
  packSize: number;
  price: number;
  isFree: boolean;
  imageUrl: string | null;
  address: string | null;
  requiresValidation: boolean;
  allowsDirectPayment: boolean;
  isPublished: boolean;
  availableSlotKeys: string[] | null;
}): ServiceFormValues {
  return {
    name: service.name,
    description: normalizeServiceDescriptionHtml(service.description),
    duration: String(service.durationMinutes),
    packSize: String(service.packSize),
    price: String(service.price),
    isFree: service.isFree,
    imageUrl: service.imageUrl ?? "",
    address: service.address ?? "",
    addressFromPlaces: true,
    requiresValidation: service.requiresValidation,
    allowsDirectPayment: service.allowsDirectPayment,
    isPublished: service.isPublished,
    availableSlotKeys: Array.isArray(service.availableSlotKeys) ? [...service.availableSlotKeys] : [],
  };
}

export function buildServiceFormSchemaMessages(
  t: (key: string, values?: Record<string, string | number>) => string,
): ServiceFormSchemaMessages {
  return {
    nameRequired: t("services.validation.nameRequired"),
    descriptionRequired: t("services.validation.descriptionRequired"),
    descriptionMax: t("services.validation.descriptionMax", { max: SERVICE_DESCRIPTION_MAX_CHARS }),
    addressRequired: t("services.validation.addressRequired"),
    durationNumber: t("services.validation.durationNumber"),
    durationMin30: t("services.validation.durationMin30"),
    durationMultipleOf30: t("services.validation.durationMultipleOf30"),
    packSizeNumber: t("services.validation.packSizeNumber"),
    packSizePositive: t("services.validation.packSizePositive"),
    priceNumber: t("services.validation.priceNumber"),
    priceNonNegative: t("services.validation.priceNonNegative"),
    imageInvalidType: t("services.validation.imageInvalidType"),
  };
}
