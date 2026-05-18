import type { ServiceFormValues } from "#/utils/service-form-schema";

export type ServiceApiPayload = {
  name: string;
  description: string;
  durationMinutes: number;
  packSize: number;
  price: number;
  isFree: boolean;
  imageUrl: string | null;
  address: string;
  availableSlotKeys: string[];
  requiresValidation: boolean;
  allowsDirectPayment: boolean;
  isPublished: boolean;
};

export function buildServiceApiPayload(values: ServiceFormValues): ServiceApiPayload {
  const parsedDuration = Number.parseInt(values.duration, 10);
  const parsedPackSize = Number.parseInt(values.packSize, 10);
  const parsedPrice = Number.parseFloat(values.price.replace(",", "."));
  const trimmedImage = values.imageUrl.trim();
  const payloadIsFree = parsedPrice === 0;

  return {
    name: values.name.trim(),
    description: values.description.trim(),
    durationMinutes: parsedDuration,
    packSize: parsedPackSize,
    price: parsedPrice,
    isFree: payloadIsFree,
    imageUrl: trimmedImage.length > 0 ? trimmedImage : null,
    address: values.address.trim(),
    availableSlotKeys: [...values.availableSlotKeys],
    requiresValidation: values.requiresValidation,
    allowsDirectPayment: values.allowsDirectPayment,
    isPublished: values.isPublished,
  };
}
