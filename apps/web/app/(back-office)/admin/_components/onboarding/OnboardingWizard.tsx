"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";
import { Calendar, Check, Loader2 } from "lucide-react";
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
import { OnboardingServiceStep } from "#/components/service-form/onboarding-service-step";
import type { PublicStorefrontCoachCard } from "#/components/public-storefront/public-storefront-service.types";
import { GooglePlacesAddressField } from "#/components/GooglePlacesAddressField";
import {
  buildServiceFormSchema,
  buildServiceFormSchemaMessages,
  getServiceFormDefaults,
  mapExistingServiceToFormValues,
  type ServiceFormValues,
} from "#/utils/service-form-schema";
import { buildServiceApiPayload } from "#/utils/service-form-payload";

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
  /** Highest onboarding step index (0–8) unlocked via Next / server resume; used for stepper checks and navigation. */
  const [furthestOnboardingStep, setFurthestOnboardingStep] = useState(0);
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
  const updateBasicsMutation = trpc.profile.updateProfileBasics.useMutation();
  const updateAvatarMutation = trpc.profile.updateProfileAvatar.useMutation();
  const updateCalendarMutation = trpc.profile.updateCalendarAvailability.useMutation();
  const updateSlugMutation = trpc.profile.updatePublicBookingPresence.useMutation();
  const createServiceMutation = trpc.services.create.useMutation();
  const updateServiceMutation = trpc.services.update.useMutation();
  const createStripeLinkMutation = trpc.profile.createStripeOnboardingLink.useMutation();
  const createStripeOnboardingLinkAsyncRef = useRef(createStripeLinkMutation.mutateAsync);
  createStripeOnboardingLinkAsyncRef.current = createStripeLinkMutation.mutateAsync;
  const completeOnboardingMutation = trpc.profile.completeAdminOnboarding.useMutation();
  const saveOnboardingStepMutation = trpc.profile.saveAdminOnboardingStep.useMutation();
  const onboardingStepSeededUserIdRef = useRef<string | null>(null);
  const onboardingPrevStepRef = useRef<number | null>(null);
  const onboardingServiceSeededIdRef = useRef<string | null>(null);

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
    if (onboardingStatusQuery.isPending || onboardingStatusQuery.isFetching) {
      return;
    }
    if (onboardingStatusQuery.data && !onboardingStatusQuery.data.needsOnboarding) {
      router.replace("/admin");
    }
  }, [onboardingStatusQuery.isPending, onboardingStatusQuery.isFetching, onboardingStatusQuery.data, router]);

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

  const serviceFormSchema = useMemo(() => buildServiceFormSchema(buildServiceFormSchemaMessages(t)), [t]);

  const onboardingDefaultValues = useMemo(
    (): OnboardingFormValues => ({
      firstName: "",
      lastName: "",
      bio: "",
      defaultAddress: "",
      defaultAddressFromPlaces: false,
      slug: "",
    }),
    [],
  );

  const onboardingForm = useForm<OnboardingFormValues>({
    defaultValues: onboardingDefaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const serviceForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema) as Resolver<ServiceFormValues>,
    defaultValues: getServiceFormDefaults(),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (onboardingStatusQuery.isPending || !onboardingStatusQuery.data) {
      return;
    }
    const s = Math.min(8, Math.max(0, onboardingStatusQuery.data.currentStep));
    setFurthestOnboardingStep((f) => Math.max(f, s));
  }, [onboardingStatusQuery.isPending, onboardingStatusQuery.data?.currentStep]);

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
    setFurthestOnboardingStep((f) => Math.max(f, resumedStep));
    if (resumedStep === 6) {
      serviceForm.setValue("isPublished", false, { shouldDirty: false, shouldTouch: false });
    }
  }, [user?.id, onboardingStatusQuery.isPending, onboardingStatusQuery.data, onboardingForm]);

  useEffect(() => {
    const prev = onboardingPrevStepRef.current;
    onboardingPrevStepRef.current = step;
    if (step !== 6 || (servicesListQuery.data?.length ?? 0) > 0) {
      return;
    }
    if (prev === 5) {
      serviceForm.setValue("isPublished", false, { shouldDirty: false, shouldTouch: false });
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

  const watchedServiceAddress = useWatch({ control: serviceForm.control, name: "address", defaultValue: "" });
  const watchedServiceAddressFromPlaces = useWatch({
    control: serviceForm.control,
    name: "addressFromPlaces",
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

  const isServiceStepFullyValid = serviceForm.formState.isValid && isServiceAddressPlacesOk;

  const watchedSlug = useWatch({ control: onboardingForm.control, name: "slug", defaultValue: "" });
  const isSlugStepValid = useMemo(
    () => slugStepSchema.safeParse({ slug: watchedSlug }).success,
    [slugStepSchema, watchedSlug],
  );

  const coachSlugForPublicPreview = (watchedSlug.trim() || presenceQuery.data?.publicBookingSlug || "").trim();

  const coachCardForPublicPreview = useMemo((): PublicStorefrontCoachCard | null => {
    const presence = presenceQuery.data;
    if (!presence) {
      return null;
    }
    const name = composeFullName(watchedFirstName, watchedLastName);
    const displayName = name.length > 0 ? name : (user?.name?.trim() ?? "");
    return {
      name: displayName.length > 0 ? displayName : t("services.preview.defaultCoachName"),
      bio: null,
      imageUrl: presence.image ?? null,
    };
  }, [presenceQuery.data, watchedFirstName, watchedLastName, user?.name, t]);


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

  /** Prénom/nom : vides tant que l’étape « nom » n’a pas été enregistrée (currentStep 0). Après « Suivant », currentStep ≥ 1 — on réhydrate depuis le nom profil (session). */
  const profileNameSeedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user?.id || onboardingStatusQuery.isPending || !onboardingStatusQuery.data) {
      return;
    }
    const serverStep = Math.min(8, Math.max(0, onboardingStatusQuery.data.currentStep));
    const seedKey = serverStep >= 1 ? `${user.id}:${serverStep}:${user.name ?? ""}` : `${user.id}:0`;
    if (profileNameSeedKeyRef.current === seedKey) {
      return;
    }
    profileNameSeedKeyRef.current = seedKey;
    const splitName = serverStep >= 1 ? splitFullNameParts(user.name ?? "") : { firstName: "", lastName: "" };
    onboardingForm.reset({
      ...onboardingForm.getValues(),
      firstName: splitName.firstName,
      lastName: splitName.lastName,
    });
  }, [user?.id, user?.name, onboardingStatusQuery.isPending, onboardingStatusQuery.data, onboardingForm]);

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
    const prevService = serviceForm.getValues();
    const nextServiceAddress = addr.length > 0 && !prevService.address.trim() ? addr : prevService.address;
    const nextServiceFromPlaces = addr.length > 0 && !prevService.address.trim() ? true : prevService.addressFromPlaces;
    onboardingForm.reset({
      ...prev,
      defaultAddress: presenceDefaultAddress,
      defaultAddressFromPlaces: addr.length > 0,
      slug: presencePublicSlug,
    });
    serviceForm.reset({
      ...prevService,
      address: nextServiceAddress,
      addressFromPlaces: nextServiceFromPlaces,
    });
  }, [presenceReady, presenceDefaultAddress, presencePublicSlug, onboardingForm, serviceForm]);

  const goNext = useCallback(() => {
    setStep((currentStep) => {
      const nextStep = Math.min(currentStep + 1, ONBOARDING_FLOW_STEPS);
      const persistedStep = Math.min(nextStep, 8);
      setFurthestOnboardingStep((f) => {
        const nextFurthest = Math.max(f, persistedStep);
        void saveOnboardingStepMutation.mutateAsync({ step: nextFurthest });
        return nextFurthest;
      });
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


  useEffect(() => {
    const onGlobalPointerUp = () => {
      resetOnboardingSlotDrag();
    };
    window.addEventListener("pointerup", onGlobalPointerUp);
    window.addEventListener("pointercancel", onGlobalPointerUp);
    return () => {
      window.removeEventListener("pointerup", onGlobalPointerUp);
      window.removeEventListener("pointercancel", onGlobalPointerUp);
    };
  }, [resetOnboardingSlotDrag]);

  useEffect(() => {
    if (step !== 5) {
      resetOnboardingSlotDrag();
    }
  }, [step, resetOnboardingSlotDrag]);

  useEffect(() => {
    if (step !== 6) {
    }
  }, [step]);

  useEffect(() => {
    if (step !== 6) {
      return;
    }
    const existingService = servicesListQuery.data?.[0];
    if (!existingService) {
      onboardingServiceSeededIdRef.current = null;
      return;
    }
    if (onboardingServiceSeededIdRef.current === existingService.id) {
      return;
    }
    onboardingServiceSeededIdRef.current = existingService.id;
    serviceForm.reset(mapExistingServiceToFormValues(existingService));
  }, [step, servicesListQuery.data, serviceForm]);

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
      serviceForm.setValue("address", addr.length > 0 ? addr : t("onboarding.service.fallbackAddress"), {
        shouldDirty: false,
      });
      serviceForm.setValue("addressFromPlaces", addr.length > 0 ? fromPlaces : false, { shouldDirty: false });
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
    const valid = await serviceForm.trigger();
    if (!valid || !isServiceAddressPlacesOk) {
      if (!isServiceAddressPlacesOk) {
        toast.error(t("onboarding.address.mustPickFromMap"));
      }
      return;
    }
    const values = serviceForm.getValues();
    if (hasGooglePlacesAutocomplete && values.address.trim().length > 0 && !values.addressFromPlaces) {
      toast.error(t("onboarding.address.mustPickFromMap"));
      return;
    }
    try {
      const existingService = servicesListQuery.data?.[0];
      const addr =
        values.address.trim().length > 0 ? values.address.trim() : t("onboarding.service.fallbackAddress");
      const servicePayload = {
        ...buildServiceApiPayload({ ...values, address: addr }),
        allowsDirectPayment: false,
      };
      if (existingService?.id) {
        await updateServiceMutation.mutateAsync({ id: existingService.id, data: servicePayload });
      } else {
        await createServiceMutation.mutateAsync(servicePayload);
      }
      await utils.services.list.invalidate();
      goNext();
    } catch (e) {
      if (e instanceof TRPCClientError && e.message === "STRIPE_REQUIRED_TO_PUBLISH_PAID_SERVICE") {
        toast.error(t("services.visibility.stripeRequiredAlert"));
        return;
      }
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
        const result = await createStripeOnboardingLinkAsyncRef.current({ returnTo: "onboarding" });
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
  }, [step, user?.id, isPaymentsLive]);

  const openStripeOnboarding = async () => {
    const prefetched = stripePrefetchedUrl?.trim() ?? "";
    if (prefetched.length > 0) {
      setStripeBusy("navigating");
      window.location.assign(prefetched);
      return;
    }
    setStripeBusy("fetching");
    try {
      const result = await createStripeLinkMutation.mutateAsync({ returnTo: "onboarding" });
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
    const target = container.querySelector<HTMLElement>(`[data-onboarding-step="${onboardingStepperCurrentIndex}"]`);
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
      <div ref={stepperScrollContainerRef} className="scroll-smooth">
        <div className="flex w-full flex-wrap items-center justify-center gap-y-1">
          {ONBOARDING_STEPPER_KEYS.map((stepKey, index) => {
            const isCurrent = index === onboardingStepperCurrentIndex;
            const isCompleted = index !== onboardingStepperCurrentIndex && index < furthestOnboardingStep;
            const canNavigate = index <= furthestOnboardingStep;
            const lineDone = index < furthestOnboardingStep;
            const lineClassName = lineDone ? "bg-blue-500" : "bg-blue-200";
            const labelClassName = isCurrent
              ? "font-semibold text-blue-700"
              : isCompleted
                ? "text-blue-600"
                : "text-slate-400";
            const stepGlyph = isCurrent ? (
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-600 shadow-sm"
                aria-hidden
              >
                <span className="size-1.5 rounded-full bg-white" />
              </span>
            ) : isCompleted ? (
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full border border-blue-500 bg-blue-500 shadow-sm"
                aria-hidden
              >
                <Check className="size-3 text-white" strokeWidth={2.8} />
              </span>
            ) : (
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white"
                aria-hidden
              />
            );
            return (
              <div key={stepKey} className="flex min-w-0 items-center">
                <button
                  type="button"
                  className={`flex w-[86px] flex-col items-center rounded-md py-1 transition ${
                    canNavigate ? "cursor-pointer hover:bg-blue-50" : "cursor-default opacity-60"
                  }`}
                  data-onboarding-step={index}
                  onClick={() => {
                    if (canNavigate) {
                      setStep(index);
                    }
                  }}
                  disabled={!canNavigate}
                >
                  {stepGlyph}
                  <span className={`mt-1 text-center text-[10px] font-medium ${labelClassName}`}>
                    {t(`onboarding.publicProfileIntro.steps.${stepKey}`)}
                  </span>
                </button>
                {index < ONBOARDING_STEPPER_KEYS.length - 1 ? (
                  <span className={`mx-0.5 h-px w-5 ${lineClassName}`} />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const publicProfileIntro = (
    <div className="w-full px-4 pt-6 md:px-8">
      <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 to-indigo-50 px-5 py-4 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          {t("onboarding.publicProfileIntro.badge")}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900 md:text-xl">
          {t("onboarding.publicProfileIntro.title")}
        </h2>
        {onboardingStepper}
      </div>
    </div>
  );

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

  const footerDoneOnly = (
    <div className="flex flex-col gap-2 border-t border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:flex-row sm:justify-end md:px-8">
      <Button
        type="button"
        className="w-full sm:w-auto sm:min-w-[220px]"
        size="lg"
        pending={completeOnboardingMutation.isPending}
        onClick={() => void handleFinish()}
      >
        {t("onboarding.done.cta")}
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
                    <Input {...field} value={field.value ?? ""} autoComplete="given-name" className="h-11 rounded-xl" />
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
      return (
        <OnboardingServiceStep
          form={serviceForm}
          googleMapsPlacesApiKey={googleMapsPlacesApiKey}
          isOutsideOpeningHours={isOutsideOpeningHours}
          planningClosedSlotKeys={closedSet}
          coachSlugForPublicPreview={coachSlugForPublicPreview}
          coachCardForPublicPreview={coachCardForPublicPreview}
          editingServiceId={servicesListQuery.data?.[0]?.id ?? null}
          stripeReadyForPaidPublish={isPaymentsLive}
        />
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
      return {
        label: t("onboarding.next"),
        action: () => {
          void handleServiceNext();
        },
        pending: createServiceMutation.isPending || updateServiceMutation.isPending,
        disabled: !isServiceStepFullyValid,
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
      {topBar}
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
      {step >= 9
        ? footerDoneOnly
        : footerActions({
            onPrimary: () => void primary.action(),
            primaryLabel: primary.label,
            primaryDisabled: primary.disabled,
            primaryPending: primary.pending,
          })}
    </div>
  );

  return (
    <Form {...onboardingForm}>
      {shell}
    </Form>
  );
}
