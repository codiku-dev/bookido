"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useWatch, type UseFormReturn } from "react-hook-form";
import {
  Calendar,
  Eye,
  ImageUp,
  Upload,
  X,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Checkbox } from "#/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#/components/ui/form";
import { CalendarSlotHoverHint, WeeklyTimeGrid } from "#/components/calendar/WeeklyTimeGrid";
import { ServicePublicPreviewDialog } from "#/components/service-public-preview-dialog";
import { ServiceDescriptionEditor } from "#/components/tiptap/service-description-editor";
import type {
  PublicStorefrontCoachCard,
  PublicStorefrontServiceCard,
} from "#/components/public-storefront/public-storefront-service.types";
import { GooglePlacesAddressField } from "#/components/GooglePlacesAddressField";
import { ServiceImageCropDialog } from "#/components/service-image-crop-dialog";
import {
  SERVICE_BOOKING_IMAGE_RECOMMENDED_HEIGHT,
  SERVICE_BOOKING_IMAGE_RECOMMENDED_WIDTH,
} from "#/utils/service-image-crop";
import { normalizeServiceDescriptionHtml } from "#/utils/service-description-html";
import {
  getServiceFormSlotKey,
  publicBookingSlugLooksValid,
  SERVICE_FORM_TIME_SLOTS,
  type ServiceFormValues,
} from "#/utils/service-form-schema";

export type ServiceFormEditorProps = {
  form: UseFormReturn<ServiceFormValues>;
  googleMapsPlacesApiKey: string;
  placesActive: boolean;
  isOutsideOpeningHours: (dayKey: string, time: string) => boolean;
  planningClosedSlotKeys: Set<string>;
  coachSlugForPublicPreview: string;
  coachCardForPublicPreview: PublicStorefrontCoachCard | null;
  editingServiceId?: string | null;
  stripeReadyForPaidPublish: boolean;
  showAllowsDirectPayment?: boolean;
  priceFieldLabel?: string;
  showOptionalImageHint?: boolean;
  availabilityInstructionsKey?: "services.availability.instructions" | "onboarding.service.availabilityInstructions";
  visibilityBannerVariant?: "amber" | "blue";
  headerSlot?: ReactNode;
  footerSlot?: ReactNode;
  formErrorMessages?: string[];
  mutationError?: string | null;
  showValidationSummary?: boolean;
  className?: string;
  onSubmit?: (values: ServiceFormValues) => void;
};

export function ServiceFormEditor(p: ServiceFormEditorProps) {
  const t = useTranslations();
  const showAllowsDirectPayment = p.showAllowsDirectPayment ?? true;
  const priceFieldLabel = p.priceFieldLabel ?? t("services.price");
  const availabilityInstructionsKey = p.availabilityInstructionsKey ?? "services.availability.instructions";
  const visibilityBannerVariant = p.visibilityBannerVariant ?? "blue";

  const imageUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [serviceImageCropOpen, setServiceImageCropOpen] = useState(false);
  const [serviceImageCropSrc, setServiceImageCropSrc] = useState<string | null>(null);
  const [servicePreviewOpen, setServicePreviewOpen] = useState(false);
  const availabilityDragRef = useRef<{
    active: boolean;
    mode: "close" | "open" | null;
    keys: Set<string>;
  }>({
    active: false,
    mode: null,
    keys: new Set(),
  });

  const watchedForm = useWatch({ control: p.form.control });
  const watchedAddressFromPlaces = useWatch({
    control: p.form.control,
    name: "addressFromPlaces",
    defaultValue: false,
  });
  const watchedPrice = useWatch({ control: p.form.control, name: "price", defaultValue: "0" });
  const isPublished = p.form.watch("isPublished");

  const parsedWatchedPrice = Number.parseFloat(String(watchedPrice ?? "").replace(",", "."));
  const formPaidServiceBlocksPublish =
    Number.isFinite(parsedWatchedPrice) && parsedWatchedPrice > 0 && !p.stripeReadyForPaidPublish;

  const daysOfWeek = useMemo(
    () => [
      { key: "mon", short: t("public.time.days.mon.short") },
      { key: "tue", short: t("public.time.days.tue.short") },
      { key: "wed", short: t("public.time.days.wed.short") },
      { key: "thu", short: t("public.time.days.thu.short") },
      { key: "fri", short: t("public.time.days.fri.short") },
      { key: "sat", short: t("public.time.days.sat.short") },
      { key: "sun", short: t("public.time.days.sun.short") },
    ],
    [t],
  );

  const selectedServiceSlotKeys = p.form.watch("availableSlotKeys");
  const selectedServiceClosedSet = useMemo(
    () => new Set(selectedServiceSlotKeys ?? []),
    [selectedServiceSlotKeys],
  );

  const isServiceSlotManuallyClosed = useCallback(
    (dayKey: string, time: string) => selectedServiceClosedSet.has(getServiceFormSlotKey(dayKey, time)),
    [selectedServiceClosedSet],
  );

  const toggleServiceSlotAvailability = useCallback(
    (dayKey: string, time: string) => {
      if (p.isOutsideOpeningHours(dayKey, time)) {
        return;
      }
      const slotKey = getServiceFormSlotKey(dayKey, time);
      const next = new Set(p.form.getValues("availableSlotKeys") ?? []);
      if (next.has(slotKey)) {
        next.delete(slotKey);
      } else {
        next.add(slotKey);
      }
      p.form.setValue("availableSlotKeys", [...next], {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [p.form, p.isOutsideOpeningHours],
  );

  const paintServiceSlotAvailability = useCallback(
    (dayKey: string, time: string, shouldClose: boolean) => {
      if (p.isOutsideOpeningHours(dayKey, time)) {
        return;
      }
      const slotKey = getServiceFormSlotKey(dayKey, time);
      const next = new Set(p.form.getValues("availableSlotKeys") ?? []);
      if (shouldClose) {
        next.add(slotKey);
      } else {
        next.delete(slotKey);
      }
      p.form.setValue("availableSlotKeys", [...next], {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [p.form, p.isOutsideOpeningHours],
  );

  const resetAvailabilityDrag = useCallback(() => {
    availabilityDragRef.current = { active: false, mode: null, keys: new Set() };
  }, []);

  useEffect(() => {
    const onGlobalPointerUp = () => {
      resetAvailabilityDrag();
    };
    window.addEventListener("pointerup", onGlobalPointerUp);
    window.addEventListener("pointercancel", onGlobalPointerUp);
    return () => {
      window.removeEventListener("pointerup", onGlobalPointerUp);
      window.removeEventListener("pointercancel", onGlobalPointerUp);
    };
  }, [resetAvailabilityDrag]);

  const dismissServiceImageCrop = useCallback(() => {
    setServiceImageCropOpen(false);
    setServiceImageCropSrc((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  }, []);

  const handleImageUploadChange = (file: File | null) => {
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      p.form.setError("imageUrl", { message: t("services.validation.imageInvalidType") });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      p.form.setError("imageUrl", { message: t("services.validation.imageTooLarge") });
      return;
    }
    setServiceImageCropSrc((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(file);
    });
    setServiceImageCropOpen(true);
  };

  const draftPublicPreviewService = useMemo((): PublicStorefrontServiceCard | null => {
    const w = watchedForm as ServiceFormValues | undefined;
    if (!w) {
      return null;
    }
    const duration = Number.parseInt(String(w.duration ?? "60"), 10);
    const packSize = Number.parseInt(String(w.packSize ?? "1"), 10);
    const priceNum = Number.parseFloat(String(w.price ?? "0").replace(",", "."));
    const safeDuration = Number.isFinite(duration) && duration >= 30 ? duration : 60;
    const safePack = Number.isFinite(packSize) && packSize >= 1 ? packSize : 1;
    const safePrice = Number.isFinite(priceNum) && priceNum >= 0 ? priceNum : 0;
    const isFree = w.isFree === true || safePrice === 0;
    const nameTrim = (w.name ?? "").trim();
    const imageTrim = (w.imageUrl ?? "").trim();
    return {
      id: p.editingServiceId ?? "__bookido_local_preview__",
      name: nameTrim.length > 0 ? nameTrim : t("services.preview.untitledService"),
      description: normalizeServiceDescriptionHtml(w.description ?? ""),
      imageUrl: imageTrim.length > 0 ? imageTrim : null,
      address: (w.address ?? "").trim(),
      durationMinutes: safeDuration,
      packSize: safePack,
      price: safePrice,
      isFree,
    };
  }, [watchedForm, p.editingServiceId, t]);

  const coachSlug = p.coachSlugForPublicPreview.trim();
  const previewSlugValid = publicBookingSlugLooksValid(coachSlug);

  const publicPreviewButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0 gap-2"
      disabled={!previewSlugValid}
      title={!previewSlugValid ? t("services.preview.slugMissing") : undefined}
      onClick={() => setServicePreviewOpen(true)}
    >
      <Eye className="size-4" aria-hidden />
      {t("services.preview.open")}
    </Button>
  );

  const visibilityBanner =
    visibilityBannerVariant === "amber" ? (
      <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4 shadow-sm">
        <FormField
          control={p.form.control}
          name="isPublished"
          render={({ field }) => (
            <FormItem className="space-y-0 border-0 p-0 shadow-none">
              <div className="flex items-start gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(value) => {
                      const next = value === true;
                      if (next && formPaidServiceBlocksPublish) {
                        toast.error(t("services.visibility.stripeRequiredAlert"));
                        return;
                      }
                      field.onChange(next);
                    }}
                    aria-label={t("services.visibility.title")}
                  />
                </FormControl>
                <div className="space-y-1">
                  <p className="text-base font-bold text-amber-950">{t("services.visibility.title")}</p>
                  <p className="text-sm text-amber-900/90">
                    {field.value === true
                      ? t("services.visibility.publishedHint")
                      : t("services.visibility.draftHint")}
                  </p>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    ) : (
      <div className="mb-5 rounded-2xl border-2 border-blue-300 bg-blue-100 px-5 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isPublished === true}
            onCheckedChange={(value) => {
              const next = value === true;
              if (next && formPaidServiceBlocksPublish) {
                toast.error(t("services.visibility.stripeRequiredAlert"));
                return;
              }
              p.form.setValue("isPublished", next, { shouldDirty: true });
            }}
            aria-label={t("services.visibility.title")}
          />
          <div className="space-y-1">
            <p className="text-base font-bold text-slate-900">{t("services.visibility.title")}</p>
            <p className="text-sm text-slate-700">
              {isPublished ? t("services.visibility.publishedHint") : t("services.visibility.draftHint")}
            </p>
          </div>
        </div>
      </div>
    );

  const validationSummary =
    p.showValidationSummary && p.form.formState.submitCount > 0 && (p.formErrorMessages?.length ?? 0) > 0 ? (
      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <p className="font-semibold">{t("services.validation.summaryTitle")}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {p.formErrorMessages?.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </div>
    ) : null;

  const mutationErrorBlock = p.mutationError ? (
    <p className="mb-4 text-sm text-red-600">{p.mutationError}</p>
  ) : null;

  const availabilitySection = (
    <div className="mt-8 border-t border-slate-200 pt-8">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="size-5 text-slate-700" aria-hidden />
        <h3 className="text-lg font-bold text-slate-900">{t("services.availabilityTitle")}</h3>
      </div>
      <p className="mb-4 text-sm text-slate-600">{t(availabilityInstructionsKey)}</p>
      <div className="rounded-xl bg-slate-50 p-4">
        <WeeklyTimeGrid
          days={daysOfWeek.map((day) => ({ key: day.key, label: day.short }))}
          timeSlots={SERVICE_FORM_TIME_SLOTS.filter((time) =>
            daysOfWeek.some((day) => !p.isOutsideOpeningHours(day.key, time)),
          )}
          renderCell={({ day, time }) => {
            const slotKey = getServiceFormSlotKey(day.key, time);
            const outsideOnly = p.isOutsideOpeningHours(day.key, time);
            const planningClosed = p.planningClosedSlotKeys.has(slotKey);
            const manualClosed = isServiceSlotManuallyClosed(day.key, time);
            const closed = outsideOnly || planningClosed || manualClosed;
            const isOutsideClosedCell = closed && outsideOnly;
            const isPlanningClosedCell = closed && !outsideOnly && planningClosed;
            const isManualClosedCell = closed && !outsideOnly && !planningClosed && manualClosed;
            const isReadOnlyClosedCell = isOutsideClosedCell || isPlanningClosedCell;
            const slotCellClassName = `group w-full p-1 h-8 md:h-8 box-border transition-all text-left relative ${
              closed
                ? isOutsideClosedCell
                  ? "bg-slate-400 cursor-not-allowed hover:bg-slate-400"
                  : isPlanningClosedCell
                    ? "bg-slate-200 cursor-not-allowed hover:bg-slate-200"
                    : "bg-slate-100 cursor-pointer hover:bg-slate-200"
                : "bg-white hover:bg-slate-50 cursor-pointer"
            }`;
            const slotCell = isReadOnlyClosedCell ? (
              <div className={slotCellClassName} style={{ userSelect: "none" }} />
            ) : (
              <div
                role="button"
                tabIndex={0}
                className={slotCellClassName}
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  event.preventDefault();
                  const currentSlotKey = getServiceFormSlotKey(day.key, time);
                  const currentlyClosed = selectedServiceClosedSet.has(currentSlotKey);
                  const mode: "close" | "open" = currentlyClosed ? "open" : "close";
                  availabilityDragRef.current = {
                    active: true,
                    mode,
                    keys: new Set([currentSlotKey]),
                  };
                  paintServiceSlotAvailability(day.key, time, mode === "close");
                }}
                onMouseEnter={() => {
                  const drag = availabilityDragRef.current;
                  if (!drag.active || !drag.mode) return;
                  const currentSlotKey = getServiceFormSlotKey(day.key, time);
                  if (drag.keys.has(currentSlotKey)) return;
                  drag.keys.add(currentSlotKey);
                  paintServiceSlotAvailability(day.key, time, drag.mode === "close");
                }}
                onClick={() => toggleServiceSlotAvailability(day.key, time)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleServiceSlotAvailability(day.key, time);
                  }
                }}
                style={{ userSelect: "none" }}
              >
                {isManualClosedCell ? (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `repeating-linear-gradient(
                              45deg,
                              transparent,
                              transparent 10px,
                              #cbd5e1 10px,
                              #cbd5e1 11px
                            )`,
                      backgroundColor: "#f1f5f9",
                    }}
                  />
                ) : null}
              </div>
            );

            if (isOutsideClosedCell) {
              return (
                <CalendarSlotHoverHint label={t("calendar.hours.outsideSlotHint")}>{slotCell}</CalendarSlotHoverHint>
              );
            }
            if (isPlanningClosedCell) {
              return (
                <CalendarSlotHoverHint label={t("calendar.availability.manualClosedSlotHint")}>
                  <div className="relative">
                    {slotCell}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        backgroundImage: `repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 10px,
                                #94a3b8 10px,
                                #94a3b8 11px
                              )`,
                        backgroundColor: "#e2e8f0",
                      }}
                    />
                  </div>
                </CalendarSlotHoverHint>
              );
            }
            if (isManualClosedCell) {
              return (
                <CalendarSlotHoverHint label={t("calendar.availability.manualClosedSlotHint")}>
                  {slotCell}
                </CalendarSlotHoverHint>
              );
            }
            return slotCell;
          }}
        />
      </div>
      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border border-slate-300 bg-white" />
          <span className="text-slate-600">{t("public.time.available")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded border border-slate-300"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 3px, #cbd5e1 3px, #cbd5e1 4px)",
              backgroundColor: "#f1f5f9",
            }}
          />
          <span className="text-slate-600">{t("calendar.hours.closed")}</span>
        </div>
      </div>
    </div>
  );

  const fieldsGrid = (
    <div className="grid gap-6 md:grid-cols-2">
      <FormField
        control={p.form.control}
        name="name"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>{t("services.name")}</FormLabel>
            <FormControl>
              <Input {...field} placeholder={t("services.form.placeholders.name")} className="h-11 rounded-xl" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={p.form.control}
        name="description"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>{t("services.description")}</FormLabel>
            <FormControl>
              <ServiceDescriptionEditor
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={t("services.form.placeholders.description")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={p.form.control}
        name="address"
        render={({ field }) => (
          <GooglePlacesAddressField
            apiKey={p.googleMapsPlacesApiKey}
            placesActive={p.placesActive}
            addressField={{
              value: field.value,
              onChange: field.onChange,
              onBlur: field.onBlur,
              name: field.name,
              ref: field.ref,
            }}
            fromPlaces={watchedAddressFromPlaces}
            setFromPlaces={(value, options) => p.form.setValue("addressFromPlaces", value, options)}
            label={t("services.address.label")}
            hint={t("services.address.hint")}
            unvalidatedWarning={
              p.googleMapsPlacesApiKey.trim().length > 0
                ? t("services.address.pickFromSuggestionsWarning")
                : undefined
            }
            placeholder={t("services.address.placeholder")}
            inputClassName="h-11"
          />
        )}
      />
      <FormField
        control={p.form.control}
        name="duration"
        render={({ field }) => (
          <FormItem className="flex h-full min-h-0 flex-col gap-2">
            <FormLabel>
              {t("services.duration")} ({t("services.minutes")})
            </FormLabel>
            <FormControl>
              <Input
                type="text"
                inputMode="numeric"
                value={field.value}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^\d]/g, "");
                  field.onChange(next);
                }}
                placeholder={t("services.durationPlaceholder")}
                className="h-11 rounded-xl"
              />
            </FormControl>
            <div className="min-h-0 flex-1 basis-0" aria-hidden />
            <p className="text-xs leading-snug text-slate-500">{t("services.durationHint")}</p>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={p.form.control}
        name="packSize"
        render={({ field }) => (
          <FormItem className="flex h-full min-h-0 flex-col gap-2">
            <FormLabel>{t("services.packSize")}</FormLabel>
            <FormControl>
              <Input
                type="text"
                inputMode="numeric"
                value={field.value}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^\d]/g, "");
                  field.onChange(next);
                }}
                placeholder="1"
                className="h-11 rounded-xl"
              />
            </FormControl>
            <div className="min-h-0 flex-1 basis-0" aria-hidden />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={p.form.control}
        name="requiresValidation"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              </FormControl>
              <div className="space-y-1">
                <FormLabel className="cursor-pointer font-medium text-slate-900">
                  {t("services.requires.validationTitle")}
                </FormLabel>
                <p className="text-sm text-slate-600">{t("services.requires.validation.desc")}</p>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      {showAllowsDirectPayment ? (
        <FormField
          control={p.form.control}
          name="allowsDirectPayment"
          defaultValue={false}
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
                <FormControl>
                  <Checkbox checked={field.value === true} onCheckedChange={(v) => field.onChange(v === true)} />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="cursor-pointer font-medium text-slate-900">
                    {t("services.directPayment.title")}
                  </FormLabel>
                  <p className="text-sm text-slate-600">{t("services.directPayment.desc")}</p>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      <div className="flex flex-col gap-4">
        <FormField
          control={p.form.control}
          name="price"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>
                {priceFieldLabel} (€)
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={field.value}
                  onChange={(e) => {
                    const normalized = e.target.value.replace(",", ".");
                    const next = normalized.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
                    field.onChange(next);
                  }}
                  placeholder="50"
                  className="h-11 w-full max-w-[11rem] rounded-xl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={p.form.control}
        name="imageUrl"
        render={({ field }) => {
          const hasImage = Boolean(field.value?.trim().length);
          const openImagePicker = () => imageUploadInputRef.current?.click();

          const hiddenFileInput = (
            <input
              ref={imageUploadInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                handleImageUploadChange(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          );

          const hintBlock = (
            <>
              {p.showOptionalImageHint ? (
                <p className="text-xs text-slate-500">{t("onboarding.service.optionalImageHint")}</p>
              ) : null}
              <p className="text-xs text-slate-500">
                {t("services.imageInput.recommendedSize", {
                  width: SERVICE_BOOKING_IMAGE_RECOMMENDED_WIDTH,
                  height: SERVICE_BOOKING_IMAGE_RECOMMENDED_HEIGHT,
                })}
              </p>
              <p className="text-xs text-slate-500">{t("services.imageInput.hint")}</p>
            </>
          );

          const emptyDropZone = (
            <button
              type="button"
              onClick={openImagePicker}
              aria-label={t("services.imageInput.ariaUploadZone")}
              className="flex aspect-video w-full max-w-3xl cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center transition-colors hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
            >
              <Upload className="size-10 text-slate-400" aria-hidden />
              <span className="text-sm font-medium text-slate-700">{t("services.imageInput.dropPlaceholderTitle")}</span>
              <span className="text-xs text-slate-500">{t("services.imageInput.dropPlaceholderSubtitle")}</span>
            </button>
          );

          const clearServiceImage = () => {
            p.form.setValue("imageUrl", "", {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
            p.form.clearErrors("imageUrl");
            if (imageUploadInputRef.current) {
              imageUploadInputRef.current.value = "";
            }
            dismissServiceImageCrop();
          };

          const previewReplaceButton = (
            <button
              type="button"
              onClick={openImagePicker}
              aria-label={t("services.imageInput.ariaReplace")}
              className="group/btn absolute inset-0 z-0 flex cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600/40"
            >
              <img src={field.value} alt={t("services.imageInput.previewAlt")} className="h-full w-full object-cover" />
              <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/55 opacity-0 transition-opacity group-hover/btn:opacity-100">
                <ImageUp className="size-10 text-white drop-shadow" aria-hidden />
                <span className="text-sm font-medium text-white">{t("services.imageInput.hoverReplace")}</span>
              </span>
            </button>
          );

          const previewRemoveButton = (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-2 z-10 size-9 rounded-full border-0 bg-black/55 text-white shadow-md hover:bg-black/75 focus-visible:ring-white/80"
              aria-label={t("services.imageInput.ariaRemoveImage")}
              onClick={(e) => {
                e.stopPropagation();
                clearServiceImage();
              }}
            >
              <X className="size-4" aria-hidden />
            </Button>
          );

          const previewDropZone = (
            <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {previewReplaceButton}
              {previewRemoveButton}
            </div>
          );

          return (
            <FormItem className="md:col-span-2">
              <FormLabel>{t("services.imageUrl")}</FormLabel>
              <div className="space-y-2">
                {hiddenFileInput}
                {hintBlock}
                {hasImage ? previewDropZone : emptyDropZone}
              </div>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </div>
  );

  const headerRow = p.headerSlot ? (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {p.headerSlot}
      {publicPreviewButton}
    </div>
  ) : (
    <div className="mb-6 flex justify-end">{publicPreviewButton}</div>
  );

  return (
    <Fragment>
      <Form {...p.form}>
        {p.onSubmit ? (
          <form onSubmit={p.form.handleSubmit(p.onSubmit)}>
            <div className={p.className ?? "rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm md:p-6"}>
              {headerRow}
              {validationSummary}
              {mutationErrorBlock}
              {visibilityBanner}
              {fieldsGrid}
              {availabilitySection}
              {p.footerSlot}
            </div>
          </form>
        ) : (
          <div className={p.className ?? "rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm md:p-6"}>
            {headerRow}
            {validationSummary}
            {mutationErrorBlock}
            {visibilityBanner}
            {fieldsGrid}
            {availabilitySection}
            {p.footerSlot}
          </div>
        )}
      </Form>
      {draftPublicPreviewService ? (
        <ServicePublicPreviewDialog
          open={servicePreviewOpen}
          onOpenChange={setServicePreviewOpen}
          coachSlug={coachSlug}
          coach={p.coachCardForPublicPreview}
          draftServices={[draftPublicPreviewService]}
        />
      ) : null}
      <ServiceImageCropDialog
        open={serviceImageCropOpen}
        onOpenChange={(next) => {
          if (!next) {
            dismissServiceImageCrop();
          }
        }}
        imageSrc={serviceImageCropSrc}
        onApply={(dataUrl) => {
          p.form.clearErrors("imageUrl");
          p.form.setValue("imageUrl", dataUrl, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
          if (imageUploadInputRef.current) {
            imageUploadInputRef.current.value = "";
          }
        }}
      />
    </Fragment>
  );
}

