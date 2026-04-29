"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";
import { Calendar, Check, Loader2, Upload } from "lucide-react";
import BookidoLogo from "#/components/BookidoLogo";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Progress } from "#/components/ui/progress";
import { Textarea } from "#/components/ui/textarea";
import { Checkbox } from "#/components/ui/checkbox";
import { CalendarSlotHoverHint, WeeklyTimeGrid } from "#/components/calendar/WeeklyTimeGrid";
import { Switch } from "#/components/ui/switch";
import { setAdminAuthBridgeCookie } from "@web/libs/admin-auth-bridge-cookie";
import { useSession } from "@web/libs/auth-client";
import { trpc } from "@web/libs/trpc-client";
import {
  DEFAULT_CALENDAR_WEEK_HOURS,
  DEFAULT_LUNCH_BREAK_CLOSED_SLOT_KEYS,
  type CalendarWeekdayName,
  type WeekHours,
  isOutsideBusinessHours,
} from "#/utils/calendar-availability";
import { SERVICE_DESCRIPTION_MAX_CHARS } from "#/utils/service-description-limit";
import { GooglePlacesAddressField } from "#/components/GooglePlacesAddressField";

const ONBOARDING_FLOW_STEPS = 9;
const PROFESSIONAL_BIO_MAX_CHARS = 320;
const ONBOARDING_STEPPER_KEYS = [
  "name",
  "bio",
  "avatar",
  "hours",
  "address",
  "unavailable",
  "service",
  "slug",
  "stripe",
] as const;

const timeSlots = [
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

const dayKeyToWeekdayName = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
} as const;

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase();
}

function splitFullNameParts(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0] ?? "", lastName: "" };
  }
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function composeFullName(firstName: string | undefined | null, lastName: string | undefined | null): string {
  return `${(firstName ?? "").trim()} ${(lastName ?? "").trim()}`.trim();
}

function getSlotKey(dayKey: string, time: string) {
  return `${dayKey}-${time}`;
}

type OnboardingSlotDragState = {
  active: boolean;
  mode: "close" | "open" | null;
  keys: Set<string>;
};

const publicBookingSlugFormSchema = z
  .string()
  .trim()
  .min(2)
  .max(96)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "INVALID_SLUG_FORMAT");

export default function OnboardingWizard() {
  const t = useTranslations();
  const router = useRouter();
  const { data: sessionPayload, refetch: refetchSession } = useSession();
  const user = sessionPayload?.user;

  const onboardingStatusQuery = trpc.profile.getAdminOnboardingStatus.useQuery(undefined, {
    retry: false,
  });
  const presenceQuery = trpc.profile.getPublicBookingPresence.useQuery(undefined, { retry: false });
  const calendarQuery = trpc.profile.getCalendarAvailability.useQuery(undefined, { retry: false });
  const stripeStatusQuery = trpc.profile.getStripeConnectStatus.useQuery(undefined, { retry: false });
  const servicesListQuery = trpc.services.list.useQuery(undefined, { retry: false });

  const isPaymentsLive = Boolean(
    stripeStatusQuery.data?.stripeChargesEnabled && stripeStatusQuery.data?.stripePayoutsEnabled,
  );

  const utils = trpc.useUtils();
  const [step, setStep] = useState(0);
  const [weekHours, setWeekHours] = useState<WeekHours>(DEFAULT_CALENDAR_WEEK_HOURS);
  const [closedSlotKeys, setClosedSlotKeys] = useState<string[]>([...DEFAULT_LUNCH_BREAK_CLOSED_SLOT_KEYS]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarDirty, setAvatarDirty] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const presenceSeedRef = useRef<string>("");
  const stepperScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const onboardingSlotDragRef = useRef<OnboardingSlotDragState>({
    active: false,
    mode: null,
    keys: new Set(),
  });
  const serviceImageInputRef = useRef<HTMLInputElement | null>(null);
  const serviceAvailabilityDragRef = useRef<{
    active: boolean;
    mode: "close" | "open" | null;
    keys: Set<string>;
  }>({ active: false, mode: null, keys: new Set() });
  const updateBasicsMutation = trpc.profile.updateProfileBasics.useMutation();
  const updateAvatarMutation = trpc.profile.updateProfileAvatar.useMutation();
  const updateCalendarMutation = trpc.profile.updateCalendarAvailability.useMutation();
  const updateSlugMutation = trpc.profile.updatePublicBookingPresence.useMutation();
  const createServiceMutation = trpc.services.create.useMutation();
  const createStripeLinkMutation = trpc.profile.createStripeOnboardingLink.useMutation();
  const completeOnboardingMutation = trpc.profile.completeAdminOnboarding.useMutation();
  const saveOnboardingStepMutation = trpc.profile.saveAdminOnboardingStep.useMutation();
  const onboardingStepSeededUserIdRef = useRef<string | null>(null);
  const onboardingPrevStepRef = useRef<number | null>(null);

  useEffect(() => {
    if (!calendarQuery.data) {
      return;
    }
    setWeekHours(calendarQuery.data.weekHours as WeekHours);
    setClosedSlotKeys([...calendarQuery.data.closedSlotKeys]);
  }, [calendarQuery.data]);

  useEffect(() => {
    if (user) {
      setAdminAuthBridgeCookie();
    }
  }, [user]);

  useEffect(() => {
    if (onboardingStatusQuery.isPending) {
      return;
    }
    if (onboardingStatusQuery.data && !onboardingStatusQuery.data.needsOnboarding) {
      router.replace("/admin");
    }
  }, [onboardingStatusQuery.isPending, onboardingStatusQuery.data, router]);

  useEffect(() => {
    if (!presenceQuery.data) {
      return;
    }
    setAvatarPreview(presenceQuery.data.image ?? null);
  }, [presenceQuery.data?.image]);

  type OnboardingFormValues = {
    firstName: string;
    lastName: string;
    bio: string;
    defaultAddress: string;
    /** True when the value came from Google Places in this session, or was loaded from profile (trusted). */
    defaultAddressFromPlaces: boolean;
    slug: string;
    serviceName: string;
    serviceDescription: string;
    serviceAddress: string;
    /** True when service address came from Google Places or profile (trusted). */
    serviceAddressFromPlaces: boolean;
    durationMinutes: number;
    packSize: number;
    priceEuros: string;
    isPublished: boolean;
    requiresValidation: boolean;
    allowsDirectPayment: boolean;
    imageDataUrl: string;
    /** Slot keys where this service is closed (same semantics as Services admin form). */
    availableSlotKeys: string[];
  };

  const nameStepSchema = useMemo(
    () =>
      z.object({
        firstName: z
          .string()
          .trim()
          .min(1, { message: t("onboarding.validation.nameMin") }),
        lastName: z
          .string()
          .trim()
          .min(1, { message: t("onboarding.validation.nameMin") }),
      }),
    [t],
  );

  const slugStepSchema = useMemo(
    () =>
      z.object({
        slug: z
          .string()
          .trim()
          .refine((s) => s.length === 0 || publicBookingSlugFormSchema.safeParse(s).success, {
            message: t("onboarding.slug.invalidFormat"),
          }),
      }),
    [t],
  );

  const serviceStepSchema = useMemo(
    () =>
      z
        .object({
          serviceName: z.string().min(1, { message: t("onboarding.service.validation.name") }),
          serviceDescription: z
            .string()
            .trim()
            .min(1, { message: t("onboarding.service.validation.description") })
            .max(SERVICE_DESCRIPTION_MAX_CHARS, { message: t("services.validation.descriptionMax") }),
          serviceAddress: z
            .string()
            .trim()
            .min(1, { message: t("onboarding.service.validation.address") }),
          durationMinutes: z.coerce
            .number({ errorMap: () => ({ message: t("services.validation.durationNumber") }) })
            .int()
            .min(30, { message: t("services.validation.durationMin30") })
            .refine((n) => n % 30 === 0, { message: t("services.validation.durationMultipleOf30") }),
          packSize: z.coerce
            .number({ errorMap: () => ({ message: t("services.validation.packSizeNumber") }) })
            .int()
            .min(1, { message: t("services.validation.packSizePositive") }),
          priceEuros: z.string(),
          isPublished: z.boolean(),
          requiresValidation: z.boolean(),
          allowsDirectPayment: z.boolean(),
          imageDataUrl: z
            .string()
            .refine(
              (value) => value.trim().length === 0 || value.trim().startsWith("data:image/"),
              { message: t("services.validation.imageInvalidType") },
            ),
          availableSlotKeys: z.array(z.string()),
        })
        .superRefine((data, ctx) => {
          const raw = data.priceEuros.trim();
          if (raw === "") {
            return;
          }
          if (!/^\d+([.,]\d+)?$/.test(raw)) {
            ctx.addIssue({ code: "custom", message: t("services.validation.priceNumber"), path: ["priceEuros"] });
            return;
          }
          const p = Number.parseFloat(raw.replace(",", "."));
          if (Number.isNaN(p) || p < 0) {
            ctx.addIssue({ code: "custom", message: t("services.validation.priceNumber"), path: ["priceEuros"] });
            return;
          }
          if (p === 0) {
            return;
          }
        }),
    [t],
  );

  const onboardingDefaultValues = useMemo(
    (): OnboardingFormValues => ({
      firstName: "",
      lastName: "",
      bio: "",
      defaultAddress: "",
      defaultAddressFromPlaces: false,
      slug: "",
      serviceName: "",
      serviceDescription: "",
      serviceAddress: "",
      serviceAddressFromPlaces: false,
      durationMinutes: 60,
      packSize: 1,
      priceEuros: "0",
      isPublished: false,
      requiresValidation: false,
      allowsDirectPayment: false,
      imageDataUrl: "",
      availableSlotKeys: [],
    }),
    [],
  );

  const onboardingForm = useForm<OnboardingFormValues>({
    defaultValues: onboardingDefaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!user?.id || onboardingStatusQuery.isPending || !onboardingStatusQuery.data) {
      return;
    }
    if (onboardingStepSeededUserIdRef.current === user.id) {
      return;
    }
    onboardingStepSeededUserIdRef.current = user.id;
    const resumedStep = Math.min(8, Math.max(0, onboardingStatusQuery.data.currentStep));
    setStep(resumedStep);
    if (resumedStep === 6) {
      onboardingForm.setValue("isPublished", false, { shouldDirty: false, shouldTouch: false });
    }
  }, [user?.id, onboardingStatusQuery.isPending, onboardingStatusQuery.data, onboardingForm]);

  useEffect(() => {
    const prev = onboardingPrevStepRef.current;
    onboardingPrevStepRef.current = step;
    if (step !== 6 || (servicesListQuery.data?.length ?? 0) > 0) {
      return;
    }
    if (prev === 5) {
      onboardingForm.setValue("isPublished", false, { shouldDirty: false, shouldTouch: false });
    }
  }, [step, servicesListQuery.data?.length, onboardingForm]);

  const googleMapsPlacesApiKey = process.env["NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"]?.trim() ?? "";
  const hasGooglePlacesAutocomplete = googleMapsPlacesApiKey.length > 0;

  const watchedFirstName = useWatch({ control: onboardingForm.control, name: "firstName", defaultValue: "" });
  const watchedLastName = useWatch({ control: onboardingForm.control, name: "lastName", defaultValue: "" });
  const isNameStepValid = useMemo(
    () => nameStepSchema.safeParse({ firstName: watchedFirstName, lastName: watchedLastName }).success,
    [nameStepSchema, watchedFirstName, watchedLastName],
  );

  const watchedServiceName = useWatch({ control: onboardingForm.control, name: "serviceName", defaultValue: "" });
  const watchedServiceDescription = useWatch({
    control: onboardingForm.control,
    name: "serviceDescription",
    defaultValue: "",
  });
  const watchedServiceAddress = useWatch({ control: onboardingForm.control, name: "serviceAddress", defaultValue: "" });
  const watchedDurationMinutes = useWatch({
    control: onboardingForm.control,
    name: "durationMinutes",
    defaultValue: 60,
  });
  const watchedPackSize = useWatch({ control: onboardingForm.control, name: "packSize", defaultValue: 1 });
  const watchedPriceEuros = useWatch({ control: onboardingForm.control, name: "priceEuros", defaultValue: "0" });
  const watchedIsPublished = useWatch({ control: onboardingForm.control, name: "isPublished", defaultValue: false });
  const watchedRequiresValidation = useWatch({
    control: onboardingForm.control,
    name: "requiresValidation",
    defaultValue: false,
  });
  const watchedAllowsDirectPayment = useWatch({
    control: onboardingForm.control,
    name: "allowsDirectPayment",
    defaultValue: false,
  });
  const watchedImageDataUrl = useWatch({ control: onboardingForm.control, name: "imageDataUrl", defaultValue: "" });
  const watchedAvailableSlotKeys = useWatch({
    control: onboardingForm.control,
    name: "availableSlotKeys",
    defaultValue: [] as string[],
  });

  const onboardingServiceClosedSlotSet = useMemo(
    () => new Set(watchedAvailableSlotKeys ?? []),
    [watchedAvailableSlotKeys],
  );

  const watchedServiceAddressFromPlaces = useWatch({
    control: onboardingForm.control,
    name: "serviceAddressFromPlaces",
    defaultValue: false,
  });

  const isServiceAddressPlacesOk = useMemo(() => {
    if (!hasGooglePlacesAutocomplete) {
      return true;
    }
    const raw = (watchedServiceAddress ?? "").trim();
    if (raw.length === 0) {
      return true;
    }
    return Boolean(watchedServiceAddressFromPlaces);
  }, [watchedServiceAddress, watchedServiceAddressFromPlaces, hasGooglePlacesAutocomplete]);

  const isServiceStepValid = useMemo(
    () =>
      serviceStepSchema.safeParse({
        serviceName: watchedServiceName,
        serviceDescription: watchedServiceDescription,
        serviceAddress: watchedServiceAddress,
        durationMinutes: watchedDurationMinutes,
        packSize: watchedPackSize,
        priceEuros: watchedPriceEuros,
        isPublished: watchedIsPublished,
        requiresValidation: watchedRequiresValidation,
        allowsDirectPayment: watchedAllowsDirectPayment,
        imageDataUrl: watchedImageDataUrl,
        availableSlotKeys: watchedAvailableSlotKeys ?? [],
      }).success,
    [
      serviceStepSchema,
      watchedServiceName,
      watchedServiceDescription,
      watchedServiceAddress,
      watchedDurationMinutes,
      watchedPackSize,
      watchedPriceEuros,
      watchedIsPublished,
      watchedRequiresValidation,
      watchedAllowsDirectPayment,
      watchedImageDataUrl,
      watchedAvailableSlotKeys,
    ],
  );

  const isServiceStepFullyValid = isServiceStepValid && isServiceAddressPlacesOk;

  const watchedSlug = useWatch({ control: onboardingForm.control, name: "slug", defaultValue: "" });
  const isSlugStepValid = useMemo(
    () => slugStepSchema.safeParse({ slug: watchedSlug }).success,
    [slugStepSchema, watchedSlug],
  );

  const watchedDefaultAddress = useWatch({
    control: onboardingForm.control,
    name: "defaultAddress",
    defaultValue: "",
  });
  const watchedDefaultAddressFromPlaces = useWatch({
    control: onboardingForm.control,
    name: "defaultAddressFromPlaces",
    defaultValue: false,
  });
  const isAddressStepValid = useMemo(() => {
    const raw = (watchedDefaultAddress ?? "").trim();
    if (raw.length === 0) {
      return true;
    }
    if (!hasGooglePlacesAutocomplete) {
      return true;
    }
    return Boolean(watchedDefaultAddressFromPlaces);
  }, [watchedDefaultAddress, watchedDefaultAddressFromPlaces, hasGooglePlacesAutocomplete]);

  /** Session `user` is often a new object reference on each fetch — seed name once per account (empty on onboarding). */
  const profileSeedUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user?.id) {
      return;
    }
    if (profileSeedUserIdRef.current === user.id) {
      return;
    }
    profileSeedUserIdRef.current = user.id;
    const splitName = splitFullNameParts(user.name ?? "");
    onboardingForm.reset({
      ...onboardingForm.getValues(),
      firstName: splitName.firstName,
      lastName: splitName.lastName,
    });
  }, [user?.id, onboardingForm]);

  const onboardingBioSeededUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user?.id || onboardingStatusQuery.isPending || !onboardingStatusQuery.data) {
      return;
    }
    if (onboardingBioSeededUserIdRef.current === user.id) {
      return;
    }
    onboardingBioSeededUserIdRef.current = user.id;
    const rawBio = onboardingStatusQuery.data.bio;
    const bio = typeof rawBio === "string" && rawBio.length > 0 ? rawBio : "";
    onboardingForm.setValue("bio", bio, { shouldDirty: false, shouldTouch: false });
  }, [user?.id, onboardingStatusQuery.isPending, onboardingStatusQuery.data, onboardingForm]);

  const presenceReady = Boolean(presenceQuery.data);
  const presenceDefaultAddress = presenceQuery.data?.defaultAddress ?? "";
  const presencePublicSlug = presenceQuery.data?.publicBookingSlug ?? "";
  useEffect(() => {
    if (!presenceReady) {
      return;
    }
    const nextPresenceSeed = `${presenceDefaultAddress}__${presencePublicSlug}`;
    if (presenceSeedRef.current === nextPresenceSeed) {
      return;
    }
    presenceSeedRef.current = nextPresenceSeed;
    const addr = presenceDefaultAddress.trim();
    const prev = onboardingForm.getValues();
    const nextServiceAddress =
      addr.length > 0 && !prev.serviceAddress.trim() ? addr : prev.serviceAddress;
    const nextServiceFromPlaces =
      addr.length > 0 && !prev.serviceAddress.trim() ? true : prev.serviceAddressFromPlaces;
    onboardingForm.reset({
      ...prev,
      defaultAddress: presenceDefaultAddress,
      defaultAddressFromPlaces: addr.length > 0,
      slug: presencePublicSlug,
      serviceAddress: nextServiceAddress,
      serviceAddressFromPlaces: nextServiceFromPlaces,
    });
  }, [presenceReady, presenceDefaultAddress, presencePublicSlug, onboardingForm]);

  const goNext = useCallback(() => {
    setStep((currentStep) => {
      const nextStep = Math.min(currentStep + 1, ONBOARDING_FLOW_STEPS);
      const persistedStep = Math.min(nextStep, 8);
      void saveOnboardingStepMutation.mutateAsync({ step: persistedStep });
      return nextStep;
    });
  }, [saveOnboardingStepMutation]);

  const skipStep = useCallback(() => {
    goNext();
  }, [goNext]);

  const goPrevious = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const updateDayTime = (day: CalendarWeekdayName, field: "startTime" | "endTime", value: string) => {
    setWeekHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const isOutsideOpeningHours = useCallback(
    (dayKey: string, time: string) => {
      const weekdayName = dayKeyToWeekdayName[dayKey as keyof typeof dayKeyToWeekdayName];
      if (!weekdayName) {
        return true;
      }
      return isOutsideBusinessHours(weekdayName, time, weekHours);
    },
    [weekHours],
  );

  const closedSet = useMemo(() => new Set(closedSlotKeys), [closedSlotKeys]);

  const toggleClosedSlot = (dayKey: string, time: string) => {
    if (isOutsideOpeningHours(dayKey, time)) {
      return;
    }
    const slotKey = getSlotKey(dayKey, time);
    setClosedSlotKeys((prev) => {
      const next = new Set(prev);
      if (next.has(slotKey)) {
        next.delete(slotKey);
      } else {
        next.add(slotKey);
      }
      return [...next];
    });
  };

  const resetOnboardingSlotDrag = useCallback(() => {
    onboardingSlotDragRef.current = { active: false, mode: null, keys: new Set() };
  }, []);

  const resetServiceAvailabilityDrag = useCallback(() => {
    serviceAvailabilityDragRef.current = { active: false, mode: null, keys: new Set() };
  }, []);

  useEffect(() => {
    const onGlobalPointerUp = () => {
      resetOnboardingSlotDrag();
      resetServiceAvailabilityDrag();
    };
    window.addEventListener("pointerup", onGlobalPointerUp);
    window.addEventListener("pointercancel", onGlobalPointerUp);
    return () => {
      window.removeEventListener("pointerup", onGlobalPointerUp);
      window.removeEventListener("pointercancel", onGlobalPointerUp);
    };
  }, [resetOnboardingSlotDrag, resetServiceAvailabilityDrag]);

  useEffect(() => {
    if (step !== 5) {
      resetOnboardingSlotDrag();
    }
  }, [step, resetOnboardingSlotDrag]);

  useEffect(() => {
    if (step !== 6) {
      resetServiceAvailabilityDrag();
    }
  }, [step, resetServiceAvailabilityDrag]);

  const paintOnboardingSlot = useCallback(
    (dayKey: string, time: string, shouldClose: boolean) => {
      if (isOutsideOpeningHours(dayKey, time)) {
        return;
      }
      const slotKey = getSlotKey(dayKey, time);
      setClosedSlotKeys((previous) => {
        const next = new Set(previous);
        if (shouldClose) {
          next.add(slotKey);
        } else {
          next.delete(slotKey);
        }
        return [...next];
      });
    },
    [isOutsideOpeningHours],
  );

  const handleOnboardingPaintPointerDown = useCallback(
    (dayKey: string, time: string, event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }
      if (isOutsideOpeningHours(dayKey, time)) {
        return;
      }
      event.preventDefault();
      const slotKey = getSlotKey(dayKey, time);
      const currentlyManuallyClosed = closedSet.has(slotKey);
      const mode: "close" | "open" = currentlyManuallyClosed ? "open" : "close";
      onboardingSlotDragRef.current = {
        active: true,
        mode,
        keys: new Set([slotKey]),
      };
      paintOnboardingSlot(dayKey, time, mode === "close");
    },
    [closedSet, isOutsideOpeningHours, paintOnboardingSlot],
  );

  const handleOnboardingPaintPointerEnter = useCallback(
    (dayKey: string, time: string) => {
      const { active, mode, keys } = onboardingSlotDragRef.current;
      if (!active || !mode) {
        return;
      }
      if (isOutsideOpeningHours(dayKey, time)) {
        return;
      }
      const slotKey = getSlotKey(dayKey, time);
      if (keys.has(slotKey)) {
        return;
      }
      keys.add(slotKey);
      paintOnboardingSlot(dayKey, time, mode === "close");
    },
    [isOutsideOpeningHours, paintOnboardingSlot],
  );

  const toggleOnboardingServiceCalendarSlot = useCallback(
    (dayKey: string, time: string) => {
      if (isOutsideOpeningHours(dayKey, time)) {
        return;
      }
      const slotKey = getSlotKey(dayKey, time);
      const next = new Set(onboardingForm.getValues("availableSlotKeys") ?? []);
      if (next.has(slotKey)) {
        next.delete(slotKey);
      } else {
        next.add(slotKey);
      }
      onboardingForm.setValue("availableSlotKeys", [...next], {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [isOutsideOpeningHours, onboardingForm],
  );

  const paintOnboardingServiceCalendarSlot = useCallback(
    (dayKey: string, time: string, shouldClose: boolean) => {
      if (isOutsideOpeningHours(dayKey, time)) {
        return;
      }
      const slotKey = getSlotKey(dayKey, time);
      const next = new Set(onboardingForm.getValues("availableSlotKeys") ?? []);
      if (shouldClose) {
        next.add(slotKey);
      } else {
        next.delete(slotKey);
      }
      onboardingForm.setValue("availableSlotKeys", [...next], {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [isOutsideOpeningHours, onboardingForm],
  );

  const handleOnboardingServicePaintPointerDown = useCallback(
    (dayKey: string, time: string, event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }
      if (isOutsideOpeningHours(dayKey, time)) {
        return;
      }
      event.preventDefault();
      const slotKey = getSlotKey(dayKey, time);
      const manualKeys = new Set(onboardingForm.getValues("availableSlotKeys") ?? []);
      const currentlyManuallyClosed = manualKeys.has(slotKey);
      const mode: "close" | "open" = currentlyManuallyClosed ? "open" : "close";
      serviceAvailabilityDragRef.current = {
        active: true,
        mode,
        keys: new Set([slotKey]),
      };
      paintOnboardingServiceCalendarSlot(dayKey, time, mode === "close");
    },
    [isOutsideOpeningHours, onboardingForm, paintOnboardingServiceCalendarSlot],
  );

  const handleOnboardingServicePaintPointerEnter = useCallback(
    (dayKey: string, time: string) => {
      const drag = serviceAvailabilityDragRef.current;
      if (!drag.active || !drag.mode) {
        return;
      }
      if (isOutsideOpeningHours(dayKey, time)) {
        return;
      }
      const slotKey = getSlotKey(dayKey, time);
      if (drag.keys.has(slotKey)) {
        return;
      }
      drag.keys.add(slotKey);
      paintOnboardingServiceCalendarSlot(dayKey, time, drag.mode === "close");
    },
    [isOutsideOpeningHours, paintOnboardingServiceCalendarSlot],
  );

  const handleOnboardingServiceImageUpload = (file: File | null) => {
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      onboardingForm.setError("imageDataUrl", { message: t("services.validation.imageInvalidType") });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onboardingForm.setError("imageDataUrl", { message: t("services.validation.imageTooLarge") });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (result.length > 0) {
        onboardingForm.clearErrors("imageDataUrl");
        onboardingForm.setValue("imageDataUrl", result, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNameNext = async () => {
    const parsed = nameStepSchema.safeParse({
      firstName: onboardingForm.getValues("firstName"),
      lastName: onboardingForm.getValues("lastName"),
    });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErr = fieldErrors.firstName?.[0];
      const lastErr = fieldErrors.lastName?.[0];
      if (firstErr) {
        onboardingForm.setError("firstName", { message: firstErr });
      }
      if (lastErr) {
        onboardingForm.setError("lastName", { message: lastErr });
      }
      return;
    }
    const fullName = composeFullName(parsed.data.firstName, parsed.data.lastName);
    try {
      await updateBasicsMutation.mutateAsync({ name: fullName });
      await refetchSession();
      goNext();
    } catch {
      toast.error(t("profile.errors.profileUpdate"));
    }
  };

  const handleBioNext = async () => {
    const formName = composeFullName(onboardingForm.getValues("firstName"), onboardingForm.getValues("lastName"));
    const nm = user?.name?.trim() ?? formName;
    if (nm.length < 1) {
      toast.error(t("onboarding.validation.nameMissing"));
      return;
    }
    try {
      const raw = onboardingForm.getValues("bio").trim();
      await updateBasicsMutation.mutateAsync({
        name: nm,
        bio: raw.length > 0 ? raw : null,
      });
      goNext();
    } catch {
      toast.error(t("profile.errors.profileUpdate"));
    }
  };

  const handleAvatarNext = async () => {
    if (avatarDirty && avatarPreview && avatarPreview.length > 0) {
      try {
        await updateAvatarMutation.mutateAsync({ image: avatarPreview });
        await utils.profile.getPublicBookingPresence.invalidate();
      } catch {
        toast.error(t("profile.errors.profileUpdate"));
        return;
      }
    }
    goNext();
  };

  const handleHoursNext = async () => {
    try {
      await updateCalendarMutation.mutateAsync({ weekHours, closedSlotKeys });
      await utils.profile.getCalendarAvailability.invalidate();
      goNext();
    } catch {
      toast.error(t("calendar.availability.saveError"));
    }
  };

  const handleAddressNext = async () => {
    const formName = composeFullName(onboardingForm.getValues("firstName"), onboardingForm.getValues("lastName"));
    const nm = user?.name?.trim() ?? formName;
    if (nm.length < 1) {
      toast.error(t("onboarding.validation.nameMissing"));
      return;
    }
    try {
      const addr = onboardingForm.getValues("defaultAddress").trim();
      const fromPlaces = onboardingForm.getValues("defaultAddressFromPlaces");
      if (hasGooglePlacesAutocomplete && addr.length > 0 && !fromPlaces) {
        toast.error(t("onboarding.address.mustPickFromMap"));
        return;
      }
      await updateBasicsMutation.mutateAsync({
        name: nm,
        defaultAddress: addr.length > 0 ? addr : null,
      });
      onboardingForm.setValue(
        "serviceAddress",
        addr.length > 0 ? addr : t("onboarding.service.fallbackAddress"),
        { shouldDirty: false },
      );
      onboardingForm.setValue(
        "serviceAddressFromPlaces",
        addr.length > 0 ? fromPlaces : false,
        { shouldDirty: false },
      );
      goNext();
    } catch {
      toast.error(t("profile.errors.profileUpdate"));
    }
  };

  const handleUnavailableNext = async () => {
    try {
      await updateCalendarMutation.mutateAsync({ weekHours, closedSlotKeys });
      await utils.profile.getCalendarAvailability.invalidate();
      goNext();
    } catch {
      toast.error(t("calendar.availability.saveError"));
    }
  };

  const handleServiceNext = async () => {
    const parsed = serviceStepSchema.safeParse(onboardingForm.getValues());
    if (!parsed.success) {
      return;
    }
    const values = parsed.data;
    const serviceFromPlaces = onboardingForm.getValues("serviceAddressFromPlaces");
    if (
      hasGooglePlacesAutocomplete &&
      values.serviceAddress.trim().length > 0 &&
      !serviceFromPlaces
    ) {
      toast.error(t("onboarding.address.mustPickFromMap"));
      return;
    }
    try {
      const addr =
        values.serviceAddress.trim().length > 0
          ? values.serviceAddress.trim()
          : t("onboarding.service.fallbackAddress");
      const rawPrice = values.priceEuros.trim();
      const parsedPrice = rawPrice === "" ? 0 : Number.parseFloat(rawPrice.replace(",", "."));
      const price = Number.isFinite(parsedPrice) ? Math.max(0, parsedPrice) : 0;
      const trimmedImage = values.imageDataUrl.trim();
      await createServiceMutation.mutateAsync({
        name: values.serviceName.trim(),
        description: values.serviceDescription.trim(),
        durationMinutes: values.durationMinutes,
        price,
        isFree: price === 0,
        packSize: values.packSize,
        imageUrl: trimmedImage.length > 0 ? trimmedImage : null,
        address: addr,
        availableSlotKeys: [...values.availableSlotKeys],
        isPublished: values.isPublished,
        requiresValidation: values.requiresValidation,
        allowsDirectPayment: values.allowsDirectPayment,
      });
      await utils.services.list.invalidate();
      goNext();
    } catch {
      toast.error(t("services.errors.save"));
    }
  };

  const handleSlugNext = async () => {
    const parsed = slugStepSchema.safeParse({ slug: onboardingForm.getValues("slug") });
    if (!parsed.success) {
      const slugErr = parsed.error.flatten().fieldErrors.slug?.[0];
      if (slugErr) {
        onboardingForm.setError("slug", { message: slugErr });
      }
      return;
    }
    const raw = parsed.data.slug.trim().toLowerCase();
    if (raw.length === 0) {
      goNext();
      return;
    }
    try {
      await updateSlugMutation.mutateAsync({ publicBookingSlug: raw });
      await utils.profile.getPublicBookingPresence.invalidate();
      goNext();
    } catch (e) {
      if (e instanceof TRPCClientError) {
        if (e.message === "SLUG_RESERVED") {
          toast.error(t("profile.publicBooking.errors.reserved"));
          return;
        }
        if (e.message === "SLUG_ALREADY_TAKEN") {
          toast.error(t("profile.publicBooking.errors.taken"));
          return;
        }
      }
      toast.error(t("profile.publicBooking.errors.generic"));
    }
  };

  const [stripeBusy, setStripeBusy] = useState<"idle" | "fetching" | "navigating">("idle");
  const [stripePrefetchedUrl, setStripePrefetchedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 8 || !user?.id || isPaymentsLive) {
      return;
    }
    setStripePrefetchedUrl(null);
    let cancelled = false;
    void (async () => {
      try {
        const result = await createStripeLinkMutation.mutateAsync({});
        const url = result.url?.trim() ?? "";
        if (!cancelled && url.length > 0) {
          setStripePrefetchedUrl(url);
        }
      } catch {
        if (!cancelled) {
          setStripePrefetchedUrl(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, user?.id, isPaymentsLive, createStripeLinkMutation]);

  const openStripeOnboarding = async () => {
    const prefetched = stripePrefetchedUrl?.trim() ?? "";
    if (prefetched.length > 0) {
      setStripeBusy("navigating");
      window.location.assign(prefetched);
      return;
    }
    setStripeBusy("fetching");
    try {
      const result = await createStripeLinkMutation.mutateAsync({});
      const url = result.url?.trim() ?? "";
      if (typeof window !== "undefined" && url.length > 0) {
        setStripeBusy("navigating");
        window.location.assign(url);
        return;
      }
      setStripeBusy("idle");
      toast.error(t("profile.billing.connect.errors.generic"));
    } catch {
      setStripeBusy("idle");
      toast.error(t("profile.billing.connect.errors.generic"));
    }
  };

  const handleFinish = async () => {
    try {
      await completeOnboardingMutation.mutateAsync({});
      await utils.profile.getAdminOnboardingStatus.invalidate();
      await refetchSession();
      router.replace("/admin");
    } catch {
      toast.error(t("onboarding.errors.complete"));
    }
  };

  const progressValue = step >= ONBOARDING_FLOW_STEPS ? 100 : ((step + 1) / ONBOARDING_FLOW_STEPS) * 100;

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

  const weekdayI18nKey = (dayName: string) => `calendar.weekday.${dayName.toLowerCase()}`;

  const openingHoursBlock = (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-slate-900">{t("onboarding.hours.openingTitle")}</h3>
      <div className="space-y-3">
        {(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const).map((day) => (
          <div
            key={day}
            className={`rounded-xl border p-3 ${weekHours[day].enabled ? "border-blue-100 bg-white" : "border-slate-100 bg-slate-50"}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex min-w-[140px] items-center gap-3">
                <Switch
                  checked={weekHours[day].enabled}
                  onCheckedChange={(checked) => {
                    setWeekHours((prev) => ({
                      ...prev,
                      [day]: { ...prev[day], enabled: checked },
                    }));
                  }}
                />
                <span className="text-sm font-medium text-slate-900">{t(weekdayI18nKey(day))}</span>
              </div>
              {weekHours[day].enabled ? (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <select
                    value={weekHours[day].startTime}
                    onChange={(e) => updateDayTime(day, "startTime", e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <span className="text-slate-400">→</span>
                  <select
                    value={weekHours[day].endTime}
                    onChange={(e) => updateDayTime(day, "endTime", e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-sm italic text-slate-500">{t("calendar.hours.closed")}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const unavailableLegendRow = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 md:gap-x-6">
      <div className="flex items-center gap-2">
        <div className="size-4 shrink-0 rounded-sm bg-blue-600 shadow-sm" aria-hidden />
        <span>{t("onboarding.unavailable.legend.open")}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="size-4 shrink-0 rounded-sm border border-slate-200 bg-slate-100 shadow-sm" aria-hidden />
        <span>{t("onboarding.unavailable.legend.closed")}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="size-4 shrink-0 rounded-sm bg-slate-400 shadow-sm" aria-hidden />
        <span>{t("onboarding.unavailable.legend.outsideHours")}</span>
      </div>
    </div>
  );

  const unavailableGridBlock = (
    <div className="space-y-3">
      {unavailableLegendRow}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
        <WeeklyTimeGrid
          horizontalScroll={false}
          days={daysOfWeek.map((day) => ({ key: day.key, label: day.short }))}
          timeSlots={timeSlots.filter((time) => daysOfWeek.some((day) => !isOutsideOpeningHours(day.key, time)))}
          renderCell={({ day, time }) => {
            const slotKey = getSlotKey(day.key, time);
            const outsideOnly = isOutsideOpeningHours(day.key, time);
            const manuallyClosed = closedSet.has(slotKey);
            const closed = outsideOnly || manuallyClosed;
            const isOutsideClosedCell = closed && outsideOnly;
            const isOpenWithinHours = !outsideOnly && !manuallyClosed;
            const slotCellClassName = outsideOnly
              ? "group relative box-border h-8 w-full cursor-not-allowed bg-slate-400 p-1 text-left transition-all hover:bg-slate-400 md:h-8"
              : manuallyClosed
                ? "group relative box-border h-8 w-full cursor-pointer border border-slate-200 bg-slate-100 p-1 text-left transition-all hover:bg-slate-200 md:h-8"
                : "group relative box-border flex h-8 w-full cursor-pointer items-center justify-center bg-blue-600 p-1 text-left transition-all hover:bg-blue-700 md:h-8";
            const slotCell = isOutsideClosedCell ? (
              <div className={`${slotCellClassName} select-none touch-none`} />
            ) : (
              <div
                role="button"
                tabIndex={0}
                className={`${slotCellClassName} select-none touch-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1`}
                onPointerDown={(event) => handleOnboardingPaintPointerDown(day.key, time, event)}
                onPointerEnter={() => handleOnboardingPaintPointerEnter(day.key, time)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleClosedSlot(day.key, time);
                  }
                }}
              >
                {isOpenWithinHours ? <Check className="size-3.5 text-white" strokeWidth={2.5} aria-hidden /> : null}
              </div>
            );

            if (isOutsideClosedCell) {
              return (
                <CalendarSlotHoverHint label={t("calendar.hours.outsideSlotHint")}>{slotCell}</CalendarSlotHoverHint>
              );
            }
            if (manuallyClosed && !outsideOnly) {
              return (
                <CalendarSlotHoverHint label={t("onboarding.clickClosedSlotToOpen")}>{slotCell}</CalendarSlotHoverHint>
              );
            }
            return slotCell;
          }}
        />
      </div>
    </div>
  );

  const onboardingServiceAvailabilityLegendRow = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 md:gap-x-6">
      <div className="flex items-center gap-2">
        <div className="size-4 shrink-0 rounded-sm bg-blue-600 shadow-sm" aria-hidden />
        <span>{t("onboarding.service.availabilityLegend.open")}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="size-4 shrink-0 rounded-sm border border-slate-200 bg-slate-100 shadow-sm" aria-hidden />
        <span>{t("onboarding.service.availabilityLegend.closed")}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="size-4 shrink-0 rounded-sm bg-slate-400 shadow-sm" aria-hidden />
        <span>{t("onboarding.service.availabilityLegend.readOnly")}</span>
      </div>
    </div>
  );

  const onboardingServiceAvailabilityBlock = (
    <div className="mt-8 border-t border-slate-200 pt-8">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="size-5 text-slate-700" aria-hidden />
        <h3 className="text-lg font-bold text-slate-900">{t("services.availabilityTitle")}</h3>
      </div>
      <p className="mb-3 text-sm text-slate-600">{t("onboarding.service.availabilityInstructions")}</p>
      {onboardingServiceAvailabilityLegendRow}
      <div className="mt-3 rounded-xl bg-slate-50 p-4">
        <WeeklyTimeGrid
          horizontalScroll={false}
          days={daysOfWeek.map((day) => ({ key: day.key, label: day.short }))}
          timeSlots={timeSlots.filter((time) => daysOfWeek.some((day) => !isOutsideOpeningHours(day.key, time)))}
          renderCell={({ day, time }) => {
            const slotKey = getSlotKey(day.key, time);
            const outsideOnly = isOutsideOpeningHours(day.key, time);
            const planningClosed = closedSet.has(slotKey);
            const manualClosed = onboardingServiceClosedSlotSet.has(slotKey);
            const isOutsideClosedCell = outsideOnly;
            const isPlanningClosedCell = !outsideOnly && planningClosed;
            const isManualServiceClosed = !outsideOnly && !planningClosed && manualClosed;
            const isServiceOpenForBooking = !outsideOnly && !planningClosed && !manualClosed;
            const isReadOnly = isOutsideClosedCell || isPlanningClosedCell;
            const outsideClass =
              "group relative box-border h-8 w-full cursor-not-allowed bg-slate-400 p-1 text-left transition-all hover:bg-slate-400 md:h-8";
            const planningClass =
              "group relative box-border h-8 w-full cursor-not-allowed bg-slate-200 p-1 text-left transition-all hover:bg-slate-200 md:h-8";
            const manualClosedClass =
              "group relative box-border h-8 w-full cursor-pointer border border-slate-200 bg-slate-100 p-1 text-left transition-all hover:bg-slate-200 md:h-8";
            const openClass =
              "group relative box-border flex h-8 w-full cursor-pointer items-center justify-center bg-blue-600 p-1 text-left transition-all hover:bg-blue-700 md:h-8";
            const readOnlyCell = (
              <div
                className={`${isOutsideClosedCell ? outsideClass : planningClass} select-none touch-none`}
                style={{ userSelect: "none" }}
              />
            );
            const interactiveCell = (
              <div
                role="button"
                tabIndex={0}
                className={`${isManualServiceClosed ? manualClosedClass : openClass} select-none touch-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1`}
                onPointerDown={(event) => handleOnboardingServicePaintPointerDown(day.key, time, event)}
                onPointerEnter={() => handleOnboardingServicePaintPointerEnter(day.key, time)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleOnboardingServiceCalendarSlot(day.key, time);
                  }
                }}
                style={{ userSelect: "none" }}
              >
                {isServiceOpenForBooking ? (
                  <Check className="size-3.5 text-white" strokeWidth={2.5} aria-hidden />
                ) : null}
              </div>
            );
            const slotCell = isReadOnly ? readOnlyCell : interactiveCell;

            if (isOutsideClosedCell) {
              return (
                <CalendarSlotHoverHint label={t("calendar.hours.outsideSlotHint")}>{slotCell}</CalendarSlotHoverHint>
              );
            }
            if (isPlanningClosedCell) {
              return (
                <CalendarSlotHoverHint label={t("calendar.availability.manualClosedSlotHint")}>
                  {slotCell}
                </CalendarSlotHoverHint>
              );
            }
            if (isManualServiceClosed) {
              return (
                <CalendarSlotHoverHint label={t("onboarding.clickClosedSlotToOpen")}>{slotCell}</CalendarSlotHoverHint>
              );
            }
            return slotCell;
          }}
        />
      </div>
    </div>
  );

  const topBar = (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:px-8">
      <Link href="/" className="flex flex-col items-start gap-0.5">
        <BookidoLogo className="h-9 w-9 text-slate-900" showText />
        <span className="text-xs font-medium text-slate-500">Reservation pour les pro</span>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col items-end gap-1">
        <span className="text-xs font-medium text-slate-500">
          {t("onboarding.progressLabel", {
            current: Math.min(step + 1, ONBOARDING_FLOW_STEPS),
            total: ONBOARDING_FLOW_STEPS,
          })}
        </span>
        <Progress value={progressValue} className="h-2 w-full max-w-xs" />
      </div>
    </div>
  );

  const onboardingStepperCurrentIndex = Math.max(0, Math.min(step, ONBOARDING_STEPPER_KEYS.length - 1));

  useEffect(() => {
    if (step >= 9) {
      return;
    }
    const container = stepperScrollContainerRef.current;
    if (!container) {
      return;
    }
    const target = container.querySelector<HTMLElement>(
      `[data-onboarding-step="${onboardingStepperCurrentIndex}"]`,
    );
    if (!target) {
      return;
    }
    const frameId = requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    });
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [step, onboardingStepperCurrentIndex]);

  const onboardingStepper = (
    <div className="mt-3 rounded-xl border border-blue-100 bg-white/70 px-2 py-2">
      <div ref={stepperScrollContainerRef} className="overflow-x-auto scroll-smooth">
        <div className="mx-auto flex w-fit min-w-max items-center justify-center">
          {ONBOARDING_STEPPER_KEYS.map((stepKey, index) => {
            const isDone = index < onboardingStepperCurrentIndex;
            const isCurrent = index === onboardingStepperCurrentIndex;
            const circleClassName = isCurrent
              ? "border-blue-600 bg-blue-600"
              : isDone
                ? "border-blue-500 bg-blue-500"
                : "border-blue-200 bg-white";
            const lineClassName = isDone ? "bg-blue-500" : "bg-blue-200";
            const labelClassName = isCurrent ? "text-blue-700" : "text-slate-500";
            return (
              <div key={stepKey} className="flex min-w-0 items-center">
                <div className="flex w-[96px] flex-col items-center" data-onboarding-step={index}>
                  <span className={`block h-2.5 w-2.5 rounded-full border ${circleClassName}`} />
                  <span className={`mt-1 text-center text-[10px] font-medium ${labelClassName}`}>
                    {t(`onboarding.publicProfileIntro.steps.${stepKey}`)}
                  </span>
                </div>
                {index < ONBOARDING_STEPPER_KEYS.length - 1 ? (
                  <span className={`mx-1 h-px w-8 ${lineClassName}`} />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const publicProfileIntro =
    step < 9 ? (
      <div className="mx-auto w-full max-w-5xl px-4 pt-6 md:px-8">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 md:px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            {t("onboarding.publicProfileIntro.badge")}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900 md:text-xl">
            {t("onboarding.publicProfileIntro.title")}
          </h2>
          {onboardingStepper}
        </div>
      </div>
    ) : null;

  const footerActions = (p: {
    onPrimary: () => void;
    primaryLabel: string;
    primaryDisabled?: boolean;
    primaryPending?: boolean;
  }) => (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:flex-row sm:justify-end md:px-8">
      <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={skipStep}>
        {t("onboarding.skipLater")}
      </Button>
      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={goPrevious} disabled={step <= 0}>
        {t("onboarding.previous")}
      </Button>
      <Button
        type="button"
        className="w-full sm:w-auto"
        disabled={p.primaryDisabled ?? false}
        pending={p.primaryPending ?? false}
        onClick={() => void p.onPrimary()}
      >
        {p.primaryLabel}
      </Button>
    </div>
  );

  const loadingGate =
    onboardingStatusQuery.isPending || !user || ((step === 3 || step === 5) && calendarQuery.isPending);

  const renderBody = () => {
    if (step === 9) {
      const congrats = (
        <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10 text-center md:px-8">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("onboarding.done.title")}</h1>
          <p className="text-slate-600">{t("onboarding.done.subtitle")}</p>
          <Button
            type="button"
            className="mx-auto w-full max-w-sm"
            size="lg"
            pending={completeOnboardingMutation.isPending}
            onClick={() => void handleFinish()}
          >
            {t("onboarding.done.cta")}
          </Button>
        </div>
      );
      return congrats;
    }

    if (step === 0) {
      return (
        <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10 md:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("onboarding.name.title")}</h1>
            <p className="mt-2 text-slate-600">{t("onboarding.name.subtitle")}</p>
          </div>
          <div className="space-y-4">
            <FormField
              control={onboardingForm.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("onboarding.name.firstNameLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      autoComplete="given-name"
                      className="h-11 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={onboardingForm.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("onboarding.name.lastNameLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      autoComplete="family-name"
                      className="h-11 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10 md:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("onboarding.bio.title")}</h1>
            <p className="mt-2 text-slate-600">{t("onboarding.bio.subtitle")}</p>
          </div>
          <FormField
            control={onboardingForm.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("onboarding.bio.fieldLabel")}</FormLabel>
                <FormControl>
                  <Textarea
                    rows={6}
                    maxLength={PROFESSIONAL_BIO_MAX_CHARS}
                    className="min-h-[140px] rounded-xl"
                    placeholder={t("onboarding.bio.placeholder")}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    }

    if (step === 2) {
      const displayName =
        user?.name ??
        composeFullName(onboardingForm.getValues("firstName"), onboardingForm.getValues("lastName")) ??
        "";
      const avatarBlock = (
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-28 w-28 border border-slate-200 shadow-sm">
            {avatarPreview ? <AvatarImage src={avatarPreview} alt="" /> : null}
            <AvatarFallback className="bg-blue-600 text-2xl font-semibold text-white">
              {initialsFromName(displayName)}
            </AvatarFallback>
          </Avatar>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || !file.type.startsWith("image/")) {
                toast.error(t("profile.publicBooking.imageInvalidType"));
                return;
              }
              if (file.size > 5 * 1024 * 1024) {
                toast.error(t("profile.publicBooking.imageTooLarge"));
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                const r = typeof reader.result === "string" ? reader.result : "";
                if (r.length > 0) {
                  setAvatarPreview(r);
                  setAvatarDirty(true);
                }
              };
              reader.readAsDataURL(file);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              avatarInputRef.current?.click();
            }}
          >
            {t("onboarding.avatar.choose")}
          </Button>
        </div>
      );

      return (
        <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10 md:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("onboarding.avatar.title")}</h1>
            <p className="mt-2 text-slate-600">{t("onboarding.avatar.subtitle")}</p>
          </div>
          {avatarBlock}
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 md:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("onboarding.hours.title")}</h1>
            <p className="mt-2 text-slate-600">{t("onboarding.hours.subtitle")}</p>
          </div>
          {calendarQuery.isError ? (
            <p className="text-sm text-red-600">{t("onboarding.hours.loadError")}</p>
          ) : (
            openingHoursBlock
          )}
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10 md:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("onboarding.address.title")}</h1>
            <p className="mt-2 text-slate-600">{t("onboarding.address.subtitle")}</p>
            <p className="mt-2 text-sm text-slate-500">{t("onboarding.address.note")}</p>
          </div>
          <div className="space-y-4">
            <FormField
              control={onboardingForm.control}
              name="defaultAddress"
              render={({ field }) => (
                <GooglePlacesAddressField
                  apiKey={googleMapsPlacesApiKey}
                  placesActive={step === 4}
                  addressField={{
                    value: field.value,
                    onChange: field.onChange,
                    onBlur: field.onBlur,
                    name: field.name,
                    ref: field.ref,
                  }}
                  fromPlaces={watchedDefaultAddressFromPlaces}
                  setFromPlaces={(value, options) =>
                    onboardingForm.setValue("defaultAddressFromPlaces", value, options)
                  }
                  label={t("onboarding.address.fieldLabel")}
                  placeholder={t("onboarding.address.placeholder")}
                  inputId="defaultAddress"
                />
              )}
            />
          </div>
        </div>
      );
    }

    if (step === 5) {
      return (
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 md:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("onboarding.unavailable.title")}</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">{t("onboarding.unavailable.subtitle")}</p>
          </div>
          {unavailableGridBlock}
        </div>
      );
    }

    if (step === 6) {
      const hasService = (servicesListQuery.data?.length ?? 0) > 0;
      const servicePlacesActive = step === 6 && !hasService;

      if (hasService) {
        return (
          <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 md:px-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("onboarding.service.title")}</h1>
              <p className="mt-2 text-slate-600">{t("onboarding.service.subtitle")}</p>
            </div>
            <p className="text-sm font-medium text-emerald-800">{t("onboarding.service.alreadyHave")}</p>
          </div>
        );
      }

      const serviceVisibilityBanner = (
        <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4 shadow-sm">
          <FormField
            control={onboardingForm.control}
            name="isPublished"
            render={({ field }) => (
              <FormItem className="space-y-0 border-0 p-0 shadow-none">
                <div className="flex items-start gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value === true}
                      onCheckedChange={(value) => {
                        field.onChange(value === true);
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
      );

      return (
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 md:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("onboarding.service.title")}</h1>
            <p className="mt-2 text-slate-600">{t("onboarding.service.subtitle")}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm md:p-6">
            {serviceVisibilityBanner}
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={onboardingForm.control}
                name="serviceName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("services.name")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("services.form.placeholders.name")}
                        className="h-11 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={onboardingForm.control}
                name="serviceDescription"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <div className="flex items-end justify-between gap-2">
                      <FormLabel>{t("services.description")}</FormLabel>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {t("services.validation.descriptionCharCount", {
                          current: field.value.length,
                          max: SERVICE_DESCRIPTION_MAX_CHARS,
                        })}
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        maxLength={SERVICE_DESCRIPTION_MAX_CHARS}
                        placeholder={t("services.form.placeholders.description")}
                        rows={3}
                        className="min-h-[96px] rounded-xl"
                        onChange={(e) => {
                          field.onChange(e.target.value.slice(0, SERVICE_DESCRIPTION_MAX_CHARS));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={onboardingForm.control}
                name="serviceAddress"
                render={({ field }) => (
                  <GooglePlacesAddressField
                    apiKey={googleMapsPlacesApiKey}
                    placesActive={servicePlacesActive}
                    addressField={{
                      value: field.value,
                      onChange: field.onChange,
                      onBlur: field.onBlur,
                      name: field.name,
                      ref: field.ref,
                    }}
                    fromPlaces={watchedServiceAddressFromPlaces}
                    setFromPlaces={(value, options) =>
                      onboardingForm.setValue("serviceAddressFromPlaces", value, options)
                    }
                    label={t("services.address.label")}
                    hint={t("services.address.hint")}
                    placeholder={t("services.address.placeholder")}
                    inputClassName="h-11"
                  />
                )}
              />
              <FormField
                control={onboardingForm.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem className="flex h-full min-h-0 flex-col gap-2">
                    <FormLabel>
                      {t("services.duration")} ({t("services.minutes")})
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={String(field.value)}
                        onChange={(e) => {
                          const next = e.target.value.replace(/[^\d]/g, "");
                          if (next === "") {
                            field.onChange(0);
                            return;
                          }
                          field.onChange(Number.parseInt(next, 10));
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
                control={onboardingForm.control}
                name="packSize"
                render={({ field }) => (
                  <FormItem className="flex h-full min-h-0 flex-col gap-2">
                    <FormLabel>{t("services.packSize")}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={String(field.value)}
                        onChange={(e) => {
                          const next = e.target.value.replace(/[^\d]/g, "");
                          if (next === "") {
                            field.onChange(0);
                            return;
                          }
                          field.onChange(Number.parseInt(next, 10));
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
                control={onboardingForm.control}
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
              {false ? (
                <FormField
                  control={onboardingForm.control}
                  name="allowsDirectPayment"
                  render={({ field }) => (
                    <FormItem>
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
              {/* Paid mode: set the ternary above to `true` to restore direct / on-site payment. */}
              <FormField
                control={onboardingForm.control}
                name="priceEuros"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("onboarding.service.packTotalPriceLabel")} (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={field.value}
                        onChange={(e) => {
                          const normalized = e.target.value.replace(",", ".");
                          const next = normalized
                            .replace(/[^\d.]/g, "")
                            .replace(/(\..*)\./g, "$1");
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
              <FormField
                control={onboardingForm.control}
                name="imageDataUrl"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <div className="flex items-center gap-2">
                      <FormLabel>{t("services.imageUrl")}</FormLabel>
                      <Upload className="size-4 text-slate-500" aria-hidden />
                    </div>
                    <div className="space-y-2">
                      <Input
                        ref={serviceImageInputRef}
                        type="file"
                        accept="image/*"
                        className="h-11 rounded-xl file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1"
                        onChange={(e) => {
                          handleOnboardingServiceImageUpload(e.target.files?.[0] ?? null);
                          e.target.value = "";
                        }}
                      />
                      <p className="text-xs text-slate-500">{t("services.imageInput.hint")}</p>
                      {field.value?.length ? (
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                          <img
                            src={field.value}
                            alt={t("services.imageInput.previewAlt")}
                            className="h-40 w-full object-cover"
                          />
                        </div>
                      ) : null}
                      {field.value?.length ? (
                        <p className="text-xs text-slate-500">{t("services.imageInput.previewReady")}</p>
                      ) : null}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {onboardingServiceAvailabilityBlock}
          </div>
        </div>
      );
    }

    if (step === 7) {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      return (
        <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10 md:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("onboarding.slug.title")}</h1>
            <p className="mt-2 text-slate-600">{t("onboarding.slug.subtitle")}</p>
          </div>
          <div className="space-y-4">
            <FormField
              control={onboardingForm.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("onboarding.slug.fieldLabel")}</FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <span className="text-sm text-slate-500">{origin}/</span>
                      <Input {...field} className="h-11 flex-1 rounded-xl font-mono text-sm" autoComplete="off" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      );
    }

    if (step === 8) {
      return (
        <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10 md:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("onboarding.stripe.title")}</h1>
            <p className="mt-2 text-slate-600">{t("onboarding.stripe.subtitle")}</p>
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              {t("onboarding.stripe.publishBlocked")}
            </p>
            {isPaymentsLive ? (
              <p className="text-sm font-medium text-emerald-800">{t("onboarding.stripe.ready")}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            pending={stripeBusy !== "idle"}
            onClick={() => void openStripeOnboarding()}
          >
            {t("onboarding.stripe.cta")}
          </Button>
        </div>
      );
    }

    return null;
  };

  const primaryForStep = (): {
    label: string;
    action: () => void | Promise<void>;
    disabled?: boolean;
    pending?: boolean;
  } => {
    if (step === 9) {
      return { label: t("onboarding.done.cta"), action: handleFinish, pending: completeOnboardingMutation.isPending };
    }
    if (step === 0) {
      return {
        label: t("onboarding.next"),
        action: () => void handleNameNext(),
        pending: updateBasicsMutation.isPending,
        disabled: !isNameStepValid,
      };
    }
    if (step === 1) {
      return {
        label: t("onboarding.next"),
        action: () => void handleBioNext(),
        pending: updateBasicsMutation.isPending,
      };
    }
    if (step === 2) {
      return {
        label: t("onboarding.next"),
        action: () => void handleAvatarNext(),
        pending: updateAvatarMutation.isPending,
      };
    }
    if (step === 3) {
      return {
        label: t("onboarding.next"),
        action: () => void handleHoursNext(),
        pending: updateCalendarMutation.isPending,
      };
    }
    if (step === 4) {
      return {
        label: t("onboarding.next"),
        action: () => void handleAddressNext(),
        pending: updateBasicsMutation.isPending,
        disabled: !isAddressStepValid,
      };
    }
    if (step === 5) {
      return {
        label: t("onboarding.next"),
        action: () => void handleUnavailableNext(),
        pending: updateCalendarMutation.isPending,
      };
    }
    if (step === 6) {
      const hasService = (servicesListQuery.data?.length ?? 0) > 0;
      return {
        label: t("onboarding.next"),
        action: () => {
          if (hasService) {
            goNext();
            return;
          }
          void handleServiceNext();
        },
        pending: createServiceMutation.isPending,
        disabled: hasService ? false : !isServiceStepFullyValid,
      };
    }
    if (step === 7) {
      return {
        label: t("onboarding.next"),
        action: () => void handleSlugNext(),
        pending: updateSlugMutation.isPending,
        disabled: !isSlugStepValid,
      };
    }
    if (step === 8) {
      return { label: t("onboarding.next"), action: () => void goNext() };
    }
    return { label: t("onboarding.next"), action: () => {} };
  };

  const primary = primaryForStep();

  const shell = (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {step < 9 ? topBar : null}
      {publicProfileIntro}
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-y-auto px-0 pb-6 md:overflow-y-visible md:px-8">
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loadingGate && step < 9 ? (
            <Loader2 className="mx-auto my-20 h-10 w-10 animate-spin text-slate-400" />
          ) : (
            renderBody()
          )}
        </div>
      </div>
      {step < 9
        ? footerActions({
            onPrimary: () => void primary.action(),
            primaryLabel: primary.label,
            primaryDisabled: primary.disabled,
            primaryPending: primary.pending,
          })
        : null}
    </div>
  );

  return <Form {...onboardingForm}>{shell}</Form>;
}
