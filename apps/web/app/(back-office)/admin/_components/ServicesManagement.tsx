"use client";

import { Fragment, useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import {
  Calendar,
  Clock,
  CreditCard,
  Copy,
  Euro,
  Image as ImageIcon,
  Loader2,
  MoreHorizontal,
  Package,
  Plus,
  Upload,
  Wallet,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Checkbox } from "#/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#/components/ui/form";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@repo/trpc/router";
import { trpc } from "@web/libs/trpc-client";

type ServiceRow = inferRouterOutputs<AppRouter>["services"]["list"][number];

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
];

const buildServiceFormSchema = (p: {
  nameRequired: string;
  descriptionRequired: string;
  addressRequired: string;
  durationNumber: string;
  durationPositive: string;
  packSizeNumber: string;
  packSizePositive: string;
  priceNumber: string;
  priceNonNegative: string;
  imageRequired: string;
  imageInvalidType: string;
}) => {
  const normalizedNumeric = z.union([z.string(), z.number()]).transform((value) => String(value).trim());

  return z.object({
    name: z.string().min(1, p.nameRequired),
    description: z.string().trim().min(1, p.descriptionRequired),
    duration: normalizedNumeric
      .refine((value) => value.length > 0, p.durationNumber)
      .refine((value) => /^\d+$/.test(value), p.durationNumber)
      .refine((value) => Number.parseInt(value, 10) > 0, p.durationPositive),
    packSize: normalizedNumeric
      .refine((value) => value.length > 0, p.packSizeNumber)
      .refine((value) => /^\d+$/.test(value), p.packSizeNumber)
      .refine((value) => Number.parseInt(value, 10) >= 1, p.packSizePositive),
    price: normalizedNumeric
      .refine((value) => value.length > 0, p.priceNumber)
      .refine((value) => /^\d+(?:[.,]\d+)?$/.test(value), p.priceNumber)
      .refine((value) => Number.parseFloat(value.replace(",", ".")) >= 0, p.priceNonNegative),
    isFree: z.boolean(),
    imageUrl: z
      .string()
      .min(1, p.imageRequired)
      .refine((value) => value.startsWith("data:image/"), p.imageInvalidType),
    address: z.string().trim().min(1, p.addressRequired).max(500),
    requiresValidation: z.boolean(),
    allowsDirectPayment: z.boolean(),
    availableSlotKeys: z.array(z.string()),
  });
};

type ServiceFormValues = z.infer<ReturnType<typeof buildServiceFormSchema>>;

/** Fresh defaults on each reset so `availableSlotKeys` is never a shared mutable array reference. */
function getServiceFormDefaults(): ServiceFormValues {
  return {
    name: "",
    description: "",
    duration: "60",
    packSize: "1",
    price: "0",
    isFree: false,
    imageUrl: "",
    address: "",
    requiresValidation: false,
    allowsDirectPayment: false,
    availableSlotKeys: [],
  };
}

function getSlotKey(dayKey: string, time: string) {
  return `${dayKey}-${time}`;
}

const dayKeyToWeekdayName = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
} as const;

function timeToMinutes(timeValue: string) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getDuplicatedServiceName(p: { originalName: string; existingNames: string[] }) {
  const baseName = p.originalName.replace(/\s\(copie \d+\)$/i, "").trim();
  const baseNameRegex = escapeForRegex(baseName);
  const duplicateRegex = new RegExp(`^${baseNameRegex}\\s\\(copie\\s(\\d+)\\)$`, "i");

  let maxCopyIndex = 0;
  for (const existingName of p.existingNames) {
    const match = duplicateRegex.exec(existingName.trim());
    if (!match?.[1]) continue;
    const parsedIndex = Number.parseInt(match[1], 10);
    if (Number.isNaN(parsedIndex)) continue;
    maxCopyIndex = Math.max(maxCopyIndex, parsedIndex);
  }

  return `${baseName} (copie ${maxCopyIndex + 1})`;
}

export default function ServicesManagement() {
  const t = useTranslations();
  const utils = trpc.useUtils();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const showDevFill = process.env.NODE_ENV === "development";
  const imageUploadInputRef = useRef<HTMLInputElement | null>(null);

  const serviceFormSchema = useMemo(
    () =>
      buildServiceFormSchema({
        nameRequired: t("services.validation.nameRequired"),
        descriptionRequired: t("services.validation.descriptionRequired"),
        addressRequired: t("services.validation.addressRequired"),
        durationNumber: t("services.validation.durationNumber"),
        durationPositive: t("services.validation.durationPositive"),
        packSizeNumber: t("services.validation.packSizeNumber"),
        packSizePositive: t("services.validation.packSizePositive"),
        priceNumber: t("services.validation.priceNumber"),
        priceNonNegative: t("services.validation.priceNonNegative"),
        imageRequired: t("services.validation.imageRequired"),
        imageInvalidType: t("services.validation.imageInvalidType"),
      }),
    [t],
  );

  const listQuery = trpc.services.list.useQuery(undefined, { retry: false });
  const availabilityQuery = trpc.profile.getCalendarAvailability.useQuery(undefined, { retry: false });
  const profilePresenceQuery = trpc.profile.getPublicBookingPresence.useQuery(undefined, { retry: false });
  const createMutation = trpc.services.create.useMutation({
    onSuccess: async () => {
      setMutationError(null);
      await utils.services.list.invalidate();
      resetFormUi();
    },
    onError: () => setMutationError(t("services.errors.save")),
  });
  const updateMutation = trpc.services.update.useMutation({
    onSuccess: async () => {
      setMutationError(null);
      await utils.services.list.invalidate();
      resetFormUi();
    },
    onError: () => setMutationError(t("services.errors.save")),
  });
  const deleteMutation = trpc.services.delete.useMutation({
    onSuccess: async () => {
      setMutationError(null);
      setDeleteTarget(null);
      await utils.services.list.invalidate();
    },
    onError: () => setMutationError(t("services.errors.delete")),
  });

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema) as Resolver<ServiceFormValues>,
    defaultValues: getServiceFormDefaults(),
  });

  const getNewServiceFormDefaults = useCallback(
    (): ServiceFormValues => ({
      ...getServiceFormDefaults(),
      address: profilePresenceQuery.data?.defaultAddress ?? "",
    }),
    [profilePresenceQuery.data?.defaultAddress],
  );

  const resetFormUi = useCallback(() => {
    form.reset(getNewServiceFormDefaults());
    setIsAdding(false);
    setEditingId(null);
  }, [form, getNewServiceFormDefaults]);

  const openCreate = () => {
    setEditingId(null);
    setIsAdding(true);
    form.reset(getNewServiceFormDefaults());
  };

  const handleDevFill = () => {
    setEditingId(null);
    setIsAdding(true);
    form.reset({
      ...getNewServiceFormDefaults(),
      name: "Demo coaching",
      description: "Une breve demo",
      duration: "60",
      packSize: "1",
      price: "0",
      isFree: true,
      imageUrl: "https://example.com/image.jpg",
      address: "123 Demo Street, Paris",
      requiresValidation: false,
      allowsDirectPayment: true,
    });
  };

  const openEdit = (service: ServiceRow) => {
    setIsAdding(false);
    setEditingId(service.id);
    form.reset({
      name: service.name,
      description: service.description,
      duration: String(service.durationMinutes),
      packSize: String(service.packSize),
      price: String(service.price),
      isFree: service.isFree,
      imageUrl: service.imageUrl ?? "",
      address: service.address ?? "",
      requiresValidation: service.requiresValidation,
      allowsDirectPayment: service.allowsDirectPayment,
      availableSlotKeys: Array.isArray(service.availableSlotKeys) ? [...service.availableSlotKeys] : [],
    });
  };

  const duplicateService = (service: ServiceRow) => {
    setMutationError(null);
    const nextName = getDuplicatedServiceName({
      originalName: service.name,
      existingNames: servicesRows.map((row) => row.name),
    });
    createMutation.mutate({
      name: nextName,
      description: service.description,
      durationMinutes: service.durationMinutes,
      packSize: service.packSize,
      price: service.price,
      isFree: service.isFree,
      imageUrl: service.imageUrl,
      address: service.address,
      availableSlotKeys: Array.isArray(service.availableSlotKeys) ? [...service.availableSlotKeys] : [],
      requiresValidation: service.requiresValidation,
      allowsDirectPayment: service.allowsDirectPayment,
    });
  };

  const daysOfWeek = [
    { key: "mon", short: t("public.time.days.mon.short") },
    { key: "tue", short: t("public.time.days.tue.short") },
    { key: "wed", short: t("public.time.days.wed.short") },
    { key: "thu", short: t("public.time.days.thu.short") },
    { key: "fri", short: t("public.time.days.fri.short") },
    { key: "sat", short: t("public.time.days.sat.short") },
    { key: "sun", short: t("public.time.days.sun.short") },
  ];

  const planningClosedSlotKeys = useMemo(
    () => new Set(availabilityQuery.data?.closedSlotKeys ?? []),
    [availabilityQuery.data?.closedSlotKeys],
  );

  const isOutsideOpeningHours = useCallback((dayKey: string, time: string) => {
    const weekdayName = dayKeyToWeekdayName[dayKey as keyof typeof dayKeyToWeekdayName];
    if (!weekdayName) {
      return true;
    }
    const dayHours = availabilityQuery.data?.weekHours?.[weekdayName];
    if (!dayHours) {
      return true;
    }
    if (!dayHours.enabled) {
      return true;
    }
    const slotMinutes = timeToMinutes(time);
    const startMinutes = timeToMinutes(dayHours.startTime);
    const endMinutes = timeToMinutes(dayHours.endTime);
    return slotMinutes < startMinutes || slotMinutes >= endMinutes;
  }, [availabilityQuery.data?.weekHours]);

  const isSlotClosed = useCallback((dayKey: string, time: string) => {
    const slotKey = getSlotKey(dayKey, time);
    return isOutsideOpeningHours(dayKey, time) || planningClosedSlotKeys.has(slotKey);
  }, [isOutsideOpeningHours, planningClosedSlotKeys]);

  const handleImageUploadChange = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      form.setError("imageUrl", { message: t("services.validation.imageInvalidType") });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      form.setError("imageUrl", { message: t("services.validation.imageTooLarge") });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (result.length > 0) {
        form.clearErrors("imageUrl");
        form.setValue("imageUrl", result, { shouldDirty: true, shouldValidate: true });
      }
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (values: ServiceFormValues) => {
    setMutationError(null);
    const trimmedImage = values.imageUrl.trim();
    const parsedDuration = Number.parseInt(values.duration, 10);
    const parsedPackSize = Number.parseInt(values.packSize, 10);
    const parsedPrice = Number.parseFloat(values.price.replace(",", "."));
    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      durationMinutes: parsedDuration,
      packSize: parsedPackSize,
      price: parsedPrice,
      isFree: parsedPrice === 0,
      imageUrl: trimmedImage.length > 0 ? trimmedImage : null,
      address: values.address.trim(),
      availableSlotKeys: availabilityQuery.data?.closedSlotKeys ?? values.availableSlotKeys,
      requiresValidation: values.requiresValidation,
      allowsDirectPayment: values.allowsDirectPayment,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const servicesRows = listQuery.data ?? [];

  const formErrorMessages = [
    form.formState.errors.name?.message,
    form.formState.errors.description?.message,
    form.formState.errors.address?.message,
    form.formState.errors.duration?.message,
    form.formState.errors.packSize?.message,
    form.formState.errors.price?.message,
    form.formState.errors.imageUrl?.message,
  ].filter((message): message is string => typeof message === "string" && message.length > 0);

  const renderHeader = () => (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("services.title")}</h1>
        <p className="max-w-2xl text-slate-600">{t("services.subtitle")}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {showDevFill ? (
          <Button type="button" variant="outline" onClick={handleDevFill} className="h-11 px-4 rounded-xl">
            {t("services.devFill")}
          </Button>
        ) : null}
        {editingId ? null : (
          <Button type="button" onClick={openCreate} className="h-11 px-6 rounded-xl">
            <Plus className="w-5 h-5" />
            {t("services.new.service")}
          </Button>
        )}
      </div>
    </div>
  );

  const renderDeleteDialog = () => (
    <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("services.deleteConfirm.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("services.deleteConfirm.description", { name: deleteTarget?.name ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">{t("services.deleteConfirm.cancel")}</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (deleteTarget) {
                deleteMutation.mutate({ id: deleteTarget.id });
              }
            }}
          >
            {t("services.deleteConfirm.confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderServiceCard = (service: ServiceRow) => (
    <div
      key={service.id}
      role="button"
      tabIndex={0}
      onClick={() => openEdit(service)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openEdit(service);
        }
      }}
      className="cursor-pointer bg-white rounded-2xl border border-slate-200 p-6 text-left transition-transform duration-200 ease-out hover:scale-[1.01] hover:border-blue-300 hover:shadow-sm"
    >
      {service.imageUrl ? (
        <div className="mb-4 aspect-video bg-slate-100 rounded-xl overflow-hidden">
          <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="mb-4 aspect-video bg-slate-100 rounded-xl flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-slate-400" />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-bold text-slate-900">{service.name}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={(e) => e.stopPropagation()}
              aria-label={t("services.actions.openMenu")}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                duplicateService(service);
              }}
              disabled={createMutation.isPending}
            >
              <Copy className="w-4 h-4" />
              {t("services.actions.duplicate")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {service.description ? <p className="text-sm text-slate-600 mb-4">{service.description}</p> : null}

      <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-slate-700">
        {service.allowsDirectPayment ? (
          <Wallet className="size-3.5" aria-hidden />
        ) : (
          <CreditCard className="size-3.5" aria-hidden />
        )}
        <p>
          {t("services.paymentType.label")}{" "}
          {service.allowsDirectPayment ? t("services.paymentType.direct") : t("services.paymentType.card")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{t("services.durationValue", { minutes: service.durationMinutes })}</span>
        </div>
        {service.packSize > 1 ? (
          <div className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            <span>
              {service.packSize} {t("services.sessions")}
            </span>
          </div>
        ) : null}
      </div>

      <div className="pt-4 border-t border-slate-200">
        {service.isFree ? (
          <div className="text-lg font-bold text-green-600">{t("services.free")}</div>
        ) : (
          <div className="flex items-center gap-1">
            <Euro className="w-5 h-5 text-slate-600" />
            <span className="text-2xl font-bold text-blue-600">{service.price}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderForm = () => {
    if (!isAdding && !editingId) return null;

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            {isAdding ? t("services.form.title.create") : t("services.form.title.edit")}
          </h2>
          {form.formState.submitCount > 0 && formErrorMessages.length > 0 ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-semibold">{t("services.validation.summaryTitle")}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {formErrorMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {mutationError ? <p className="text-sm text-red-600 mb-4">{mutationError}</p> : null}
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t("services.name")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("services.form.placeholders.name")}
                      className="rounded-xl h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t("services.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("services.form.placeholders.description")}
                      rows={3}
                      className="rounded-xl min-h-[96px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t("services.address.label")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("services.address.placeholder")}
                      className="rounded-xl h-11"
                    />
                  </FormControl>
                  <p className="text-xs text-slate-500">{t("services.address.hint")}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
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
                      placeholder="60"
                      className="rounded-xl h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="packSize"
              render={({ field }) => (
                <FormItem>
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
                      className="rounded-xl h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requiresValidation"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="font-medium text-slate-900 cursor-pointer">
                        {t("services.requires.validationTitle")}
                      </FormLabel>
                      <p className="text-sm text-slate-600">{t("services.requires.validation.desc")}</p>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowsDirectPayment"
              defaultValue={false}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50">
                    <FormControl>
                      <Checkbox checked={field.value === true} onCheckedChange={(v) => field.onChange(v === true)} />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="font-medium text-slate-900 cursor-pointer">
                        {t("services.directPayment.title")}
                      </FormLabel>
                      <p className="text-sm text-slate-600">{t("services.directPayment.desc")}</p>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("services.price")} (€)</FormLabel>
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
                        className="rounded-xl h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <div className="flex items-center gap-2">
                    <FormLabel>{t("services.imageUrl")}</FormLabel>
                    <Upload className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="space-y-2">
                    <Input
                      ref={imageUploadInputRef}
                      type="file"
                      accept="image/*"
                      className="rounded-xl h-11 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1"
                      onChange={(e) => handleImageUploadChange(e.target.files?.[0] ?? null)}
                    />
                    <p className="text-xs text-slate-500">{t("services.imageInput.hint")}</p>
                    {field.value?.length ? (
                      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        <img src={field.value} alt={t("services.imageInput.previewAlt")} className="h-40 w-full object-cover" />
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

          <div className="mt-8 pt-8 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-slate-700" />
              <h3 className="text-lg font-bold text-slate-900">{t("services.availabilityTitle")}</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">{t("services.availability.readOnlyInstructions")}</p>

            <div className="bg-slate-50 rounded-xl p-4 overflow-x-auto">
              <div style={{ minWidth: "800px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `80px repeat(7, 1fr)`,
                    gap: "2px",
                    backgroundColor: "#e2e8f0",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div className="bg-slate-100" />
                  {daysOfWeek.map((day) => (
                    <div key={day.key} className="bg-slate-100 p-2 text-center">
                      <div className="text-sm font-medium text-slate-900">{day.short}</div>
                    </div>
                  ))}

                  {timeSlots.map((time) => (
                    <Fragment key={time}>
                      <div className="bg-white p-2 flex items-center justify-end pr-2">
                        <span className="text-xs text-slate-600">{time}</span>
                      </div>
                      {daysOfWeek.map((day) => {
                        const closed = isSlotClosed(day.key, time);
                        return (
                          <div
                            key={`${day.key}-${time}`}
                            className={`relative select-none p-2 ${
                              closed ? "bg-slate-100" : "bg-white"
                            }`}
                            style={{ userSelect: "none" }}
                          >
                            {closed ? (
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
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-slate-300 rounded" />
                <span className="text-slate-600">{t("public.time.available")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 border border-slate-300 rounded"
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

          <div className="flex gap-3 mt-6">
            <Button type="submit" className="h-11 px-6 rounded-xl" disabled={isSaving}>
              {isAdding ? t("services.save") : t("common.save")}
            </Button>
            <Button type="button" variant="outline" onClick={resetFormUi} className="h-11 px-6 rounded-xl">
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  const servicesLoadingPanel = (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <Loader2 className="mx-auto size-10 animate-spin text-slate-300" aria-hidden />
      <p className="mt-4 text-sm text-slate-600">{t("services.loading")}</p>
    </div>
  );

  const servicesErrorPanel = (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <p className="text-sm text-red-600">{t("services.errors.load")}</p>
    </div>
  );

  const servicesEmptyPanel = (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-slate-50/70 px-6 py-16 text-center">
        <Package className="mx-auto size-12 text-slate-300" aria-hidden />
        <h3 className="mt-4 text-lg font-semibold text-slate-900">{t("services.emptyList.title")}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">{t("services.emptyList.description")}</p>
        <Button type="button" onClick={openCreate} className="mt-6 h-11 rounded-xl px-6">
          <Plus className="size-5" />
          {t("services.emptyList.cta")}
        </Button>
      </div>
    </div>
  );

  const servicesCardsGrid = (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {servicesRows.map((service) => renderServiceCard(service))}
    </div>
  );

  const isFormMode = isAdding || editingId;

  const servicesListBody =
    isFormMode
      ? null
      : listQuery.isLoading
        ? servicesLoadingPanel
        : listQuery.isError
          ? servicesErrorPanel
          : servicesRows.length === 0
            ? servicesEmptyPanel
            : servicesCardsGrid;

  const mainWhitePanel = (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-8">
      {isFormMode ? (
        renderForm()
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 md:p-6">{servicesListBody}</div>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      {renderHeader()}
      {mainWhitePanel}
      {renderDeleteDialog()}
    </div>
  );
}
