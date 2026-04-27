"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";
import { ImagePlus, Loader2 } from "lucide-react";
import BookidoLogo from "#/components/BookidoLogo";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Progress } from "#/components/ui/progress";
import { Textarea } from "#/components/ui/textarea";
import { CalendarSlotHoverHint, WeeklyTimeGrid } from "#/components/calendar/WeeklyTimeGrid";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import { setAdminAuthBridgeCookie } from "@web/libs/admin-auth-bridge-cookie";
import { useSession } from "@web/libs/auth-client";
import { trpc } from "@web/libs/trpc-client";
import {
  DEFAULT_CALENDAR_WEEK_HOURS,
  DEFAULT_LUNCH_BREAK_CLOSED_SLOT_KEYS,
  type CalendarWeekdayName,
  type WeekHours,
  buildCalendarSlotKey,
  isOutsideBusinessHours,
} from "#/utils/calendar-availability";

const ONBOARDING_FLOW_STEPS = 9;

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
] as const;

const SERVICE_DURATION_OPTIONS = [30, 60, 90, 120, 150, 180] as const;

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

function getSlotKey(dayKey: string, time: string) {
  return `${dayKey}-${time}`;
}

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
  const serviceImageInputRef = useRef<HTMLInputElement | null>(null);

  const updateBasicsMutation = trpc.profile.updateProfileBasics.useMutation();
  const updateAvatarMutation = trpc.profile.updateProfileAvatar.useMutation();
  const updateCalendarMutation = trpc.profile.updateCalendarAvailability.useMutation();
  const updateSlugMutation = trpc.profile.updatePublicBookingPresence.useMutation();
  const createServiceMutation = trpc.services.create.useMutation();
  const createStripeLinkMutation = trpc.profile.createStripeOnboardingLink.useMutation();
  const completeOnboardingMutation = trpc.profile.completeAdminOnboarding.useMutation();

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

  const nameSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, { message: t("onboarding.validation.nameMin") }),
      }),
    [t],
  );
  const nameForm = useForm<{ name: string }>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: "" },
  });

  const bioSchema = useMemo(
    () =>
      z.object({
        bio: z.string().max(4000),
      }),
    [t],
  );
  const bioForm = useForm<{ bio: string }>({
    resolver: zodResolver(bioSchema),
    defaultValues: { bio: "" },
  });

  const addressSchema = useMemo(
    () =>
      z.object({
        defaultAddress: z.string().max(500),
      }),
    [t],
  );
  const addressForm = useForm<{ defaultAddress: string }>({
    resolver: zodResolver(addressSchema),
    defaultValues: { defaultAddress: "" },
  });

  const slugSchema = useMemo(
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
  const slugForm = useForm<{ slug: string }>({
    resolver: zodResolver(slugSchema),
    defaultValues: { slug: "" },
  });

  type OnboardingServiceFormValues = {
    name: string;
    description: string;
    address: string;
    durationMinutes: number;
    packSize: number;
    priceEuros: string;
    isFree: boolean;
    isPublished: boolean;
    requiresValidation: boolean;
    allowsDirectPayment: boolean;
    imageDataUrl: string;
  };

  const serviceSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(1, { message: t("onboarding.service.validation.name") }),
          description: z.string().trim().min(1, { message: t("onboarding.service.validation.description") }),
          address: z.string().trim().min(1, { message: t("onboarding.service.validation.address") }),
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
          isFree: z.boolean(),
          isPublished: z.boolean(),
          requiresValidation: z.boolean(),
          allowsDirectPayment: z.boolean(),
          imageDataUrl: z.string(),
        })
        .superRefine((data, ctx) => {
          if (data.isFree) {
            return;
          }
          const raw = data.priceEuros.trim();
          if (!/^\d+([.,]\d+)?$/.test(raw)) {
            ctx.addIssue({ code: "custom", message: t("services.validation.priceNumber"), path: ["priceEuros"] });
            return;
          }
          const p = Number.parseFloat(raw.replace(",", "."));
          if (Number.isNaN(p) || p <= 0) {
            ctx.addIssue({ code: "custom", message: t("onboarding.service.validation.pricePaid"), path: ["priceEuros"] });
          }
        }),
    [t],
  );

  const serviceFormDefaults = (): OnboardingServiceFormValues => ({
    name: "",
    description: "",
    address: "",
    durationMinutes: 60,
    packSize: 1,
    priceEuros: "0",
    isFree: true,
    isPublished: true,
    requiresValidation: false,
    allowsDirectPayment: false,
    imageDataUrl: "",
  });

  const serviceForm = useForm<OnboardingServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: serviceFormDefaults(),
  });

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
    nameForm.reset({ name: "" });
  }, [user?.id, nameForm]);

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
    bioForm.reset({ bio });
  }, [user?.id, onboardingStatusQuery.isPending, onboardingStatusQuery.data, bioForm]);

  const presenceReady = Boolean(presenceQuery.data);
  const presenceDefaultAddress = presenceQuery.data?.defaultAddress ?? "";
  const presencePublicSlug = presenceQuery.data?.publicBookingSlug ?? "";
  useEffect(() => {
    if (!presenceReady) {
      return;
    }
    addressForm.reset({ defaultAddress: presenceDefaultAddress });
    slugForm.reset({ slug: presencePublicSlug });
    const addr = presenceDefaultAddress.trim();
    if (addr.length > 0 && !serviceForm.getValues("address").trim()) {
      serviceForm.setValue("address", addr);
    }
  }, [presenceReady, presenceDefaultAddress, presencePublicSlug, addressForm, slugForm, serviceForm]);

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, ONBOARDING_FLOW_STEPS));
  }, []);

  const skipStep = useCallback(() => {
    goNext();
  }, [goNext]);

  const updateDayTime = (day: CalendarWeekdayName, field: "startTime" | "endTime", value: string) => {
    setWeekHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const isOutsideOpeningHours = useCallback((dayKey: string, time: string) => {
    const weekdayName = dayKeyToWeekdayName[dayKey as keyof typeof dayKeyToWeekdayName];
    if (!weekdayName) {
      return true;
    }
    return isOutsideBusinessHours(weekdayName, time, weekHours);
  }, [weekHours]);

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

  const handleNameNext = nameForm.handleSubmit(async (values) => {
    try {
      await updateBasicsMutation.mutateAsync({ name: values.name.trim() });
      await refetchSession();
      goNext();
    } catch {
      toast.error(t("profile.errors.profileUpdate"));
    }
  });

  const handleBioNext = bioForm.handleSubmit(async (values) => {
    const nm = user?.name?.trim() ?? nameForm.getValues("name").trim();
    if (nm.length < 1) {
      toast.error(t("onboarding.validation.nameMissing"));
      return;
    }
    try {
      const raw = values.bio?.trim() ?? "";
      await updateBasicsMutation.mutateAsync({
        name: nm,
        bio: raw.length > 0 ? raw : null,
      });
      goNext();
    } catch {
      toast.error(t("profile.errors.profileUpdate"));
    }
  });

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

  const handleAddressNext = addressForm.handleSubmit(async (values) => {
    const nm = user?.name?.trim() ?? nameForm.getValues("name").trim();
    if (nm.length < 1) {
      toast.error(t("onboarding.validation.nameMissing"));
      return;
    }
    try {
      const addr = values.defaultAddress?.trim() ?? "";
      await updateBasicsMutation.mutateAsync({
        name: nm,
        defaultAddress: addr.length > 0 ? addr : null,
      });
      serviceForm.setValue("address", addr.length > 0 ? addr : t("onboarding.service.fallbackAddress"), {
        shouldDirty: false,
      });
      goNext();
    } catch {
      toast.error(t("profile.errors.profileUpdate"));
    }
  });

  const handleUnavailableNext = async () => {
    try {
      await updateCalendarMutation.mutateAsync({ weekHours, closedSlotKeys });
      await utils.profile.getCalendarAvailability.invalidate();
      goNext();
    } catch {
      toast.error(t("calendar.availability.saveError"));
    }
  };

  const handleServiceNext = serviceForm.handleSubmit(async (values) => {
    try {
      const addr = values.address.trim().length > 0 ? values.address.trim() : t("onboarding.service.fallbackAddress");
      const price = values.isFree ? 0 : Number.parseFloat(values.priceEuros.trim().replace(",", "."));
      const trimmedImage = values.imageDataUrl.trim();
      await createServiceMutation.mutateAsync({
        name: values.name.trim(),
        description: values.description.trim(),
        durationMinutes: values.durationMinutes,
        price: Number.isFinite(price) ? price : 0,
        isFree: values.isFree,
        packSize: values.packSize,
        imageUrl: trimmedImage.length > 0 ? trimmedImage : null,
        address: addr,
        availableSlotKeys: [],
        isPublished: values.isPublished,
        requiresValidation: values.requiresValidation,
        allowsDirectPayment: values.allowsDirectPayment,
      });
      await utils.services.list.invalidate();
      goNext();
    } catch {
      toast.error(t("services.errors.save"));
    }
  });

  const handleSlugNext = slugForm.handleSubmit(async (values) => {
    const raw = values.slug.trim().toLowerCase();
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
  });

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

  const unavailableGridBlock = (
    <div className="space-y-3">
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
            const isManualClosedCell = closed && !outsideOnly && manuallyClosed;
            const slotCellClassName = `group relative box-border h-8 w-full p-1 text-left transition-all md:h-8 ${
              closed
                ? isOutsideClosedCell
                  ? "cursor-not-allowed bg-slate-400 hover:bg-slate-400"
                  : "cursor-pointer bg-slate-200 hover:bg-slate-300"
                : "cursor-pointer bg-white hover:bg-slate-50"
            }`;
            const slotCell = isOutsideClosedCell ? (
              <div className={slotCellClassName} style={{ userSelect: "none" }} />
            ) : (
              <button
                type="button"
                className={slotCellClassName}
                onClick={() => toggleClosedSlot(day.key, time)}
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
              </button>
            );

            if (isOutsideClosedCell) {
              return (
                <CalendarSlotHoverHint label={t("calendar.hours.outsideSlotHint")}>
                  {slotCell}
                </CalendarSlotHoverHint>
              );
            }
            return slotCell;
          }}
        />
      </div>
      <p className="text-sm text-slate-600">{t("onboarding.unavailable.hint")}</p>
    </div>
  );

  const topBar = (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:px-8">
      <BookidoLogo className="h-9 w-9 text-slate-900" showText />
      <div className="flex min-w-0 flex-1 flex-col items-end gap-1">
        <span className="text-xs font-medium text-slate-500">
          {t("onboarding.progressLabel", { current: Math.min(step + 1, ONBOARDING_FLOW_STEPS), total: ONBOARDING_FLOW_STEPS })}
        </span>
        <Progress value={progressValue} className="h-2 w-full max-w-xs" />
      </div>
    </div>
  );

  const footerActions = (p: { onPrimary: () => void; primaryLabel: string; primaryDisabled?: boolean; primaryPending?: boolean }) => (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:flex-row sm:justify-end md:px-8">
      <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={skipStep}>
        {t("onboarding.skipLater")}
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
          <Form {...nameForm}>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handleNameNext();
              }}
            >
              <FormField
                control={nameForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("onboarding.name.fieldLabel")}</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="name" className="h-11 rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
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
          <Form {...bioForm}>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handleBioNext();
              }}
            >
              <FormField
                control={bioForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("onboarding.bio.fieldLabel")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={6} className="min-h-[140px] rounded-xl" placeholder={t("onboarding.bio.placeholder")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      );
    }

    if (step === 2) {
      const displayName = user?.name ?? nameForm.getValues("name") ?? "";
      const avatarBlock = (
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-28 w-28 border border-slate-200 shadow-sm">
            {avatarPreview ? <AvatarImage src={avatarPreview} alt="" /> : null}
            <AvatarFallback className="bg-blue-600 text-2xl font-semibold text-white">{initialsFromName(displayName)}</AvatarFallback>
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
          {calendarQuery.isError ? <p className="text-sm text-red-600">{t("onboarding.hours.loadError")}</p> : openingHoursBlock}
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
          <Form {...addressForm}>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handleAddressNext();
              }}
            >
              <FormField
                control={addressForm.control}
                name="defaultAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("onboarding.address.fieldLabel")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} className="rounded-xl" placeholder={t("onboarding.address.placeholder")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      );
    }

    if (step === 5) {
      return (
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 md:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("onboarding.unavailable.title")}</h1>
            <p className="mt-2 text-slate-600">{t("onboarding.unavailable.subtitle")}</p>
          </div>
          {unavailableGridBlock}
        </div>
      );
    }

    if (step === 6) {
      const hasService = (servicesListQuery.data?.length ?? 0) > 0;
      return (
        <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10 md:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("onboarding.service.title")}</h1>
            <p className="mt-2 text-slate-600">{t("onboarding.service.subtitle")}</p>
          </div>
          {hasService ? (
            <p className="text-sm text-emerald-800">{t("onboarding.service.alreadyHave")}</p>
          ) : null}
          <Form {...serviceForm}>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handleServiceNext();
              }}
            >
              <FormField
                control={serviceForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("onboarding.service.nameLabel")}</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 rounded-xl" disabled={hasService} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={serviceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("onboarding.service.descriptionLabel")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} className="rounded-xl" disabled={hasService} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={serviceForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("onboarding.service.addressLabel")}</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 rounded-xl" disabled={hasService} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
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
          <Form {...slugForm}>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSlugNext();
              }}
            >
              <FormField
                control={slugForm.control}
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
            </form>
          </Form>
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

  const primaryForStep = (): { label: string; action: () => void | Promise<void>; disabled?: boolean; pending?: boolean } => {
    if (step === 9) {
      return { label: t("onboarding.done.cta"), action: handleFinish, pending: completeOnboardingMutation.isPending };
    }
    if (step === 0) {
      return { label: t("onboarding.next"), action: () => void handleNameNext(), pending: updateBasicsMutation.isPending };
    }
    if (step === 1) {
      return { label: t("onboarding.next"), action: () => void handleBioNext(), pending: updateBasicsMutation.isPending };
    }
    if (step === 2) {
      return { label: t("onboarding.next"), action: () => void handleAvatarNext(), pending: updateAvatarMutation.isPending };
    }
    if (step === 3) {
      return {
        label: t("onboarding.next"),
        action: () => void handleHoursNext(),
        pending: updateCalendarMutation.isPending,
      };
    }
    if (step === 4) {
      return { label: t("onboarding.next"), action: () => void handleAddressNext(), pending: updateBasicsMutation.isPending };
    }
    if (step === 5) {
      return { label: t("onboarding.next"), action: () => void handleUnavailableNext(), pending: updateCalendarMutation.isPending };
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
      };
    }
    if (step === 7) {
      return { label: t("onboarding.next"), action: () => void handleSlugNext(), pending: updateSlugMutation.isPending };
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
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:overflow-y-visible">
        {loadingGate && step < 9 ? <Loader2 className="mx-auto mt-20 h-10 w-10 animate-spin text-slate-400" /> : renderBody()}
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

  return shell;
}
