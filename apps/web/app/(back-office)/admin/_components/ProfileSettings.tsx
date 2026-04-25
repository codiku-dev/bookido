"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CreditCard,
  Link2,
  Mail,
  Receipt,
  Save,
  ShieldAlert,
  Upload,
  User,
} from "lucide-react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { useLanguage } from "#/components/use-language";
import { clearAdminAuthBridgeCookie } from "@web/libs/admin-auth-bridge-cookie";
import { signOut, useSession } from "@web/libs/auth-client";
import { trpc } from "@web/libs/trpc-client";
import { TRPCClientError } from "@trpc/react-query";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  bio?: string | null;
  image?: string | null;
};

const ARCHIVE_ERROR_CODES = new Set([
  "CONFIRM_EMAIL_MISMATCH",
  "PASSWORD_REQUIRED",
  "INVALID_PASSWORD",
  "ALREADY_ARCHIVED",
]);

function mapArchiveTrpcMessage(p: { code: string; t: ReturnType<typeof useTranslations> }): string {
  const { code } = p;
  switch (code) {
    case "CONFIRM_EMAIL_MISMATCH":
      return p.t("profile.archive.errors.CONFIRM_EMAIL_MISMATCH");
    case "PASSWORD_REQUIRED":
      return p.t("profile.archive.errors.PASSWORD_REQUIRED");
    case "INVALID_PASSWORD":
      return p.t("profile.archive.errors.INVALID_PASSWORD");
    case "ALREADY_ARCHIVED":
      return p.t("profile.archive.errors.ALREADY_ARCHIVED");
    default:
      return p.t("profile.archive.errors.generic");
  }
}

export default function ProfileSettings() {
  const t = useTranslations();
  const { locale, setLocale } = useLanguage();
  const { data: sessionPayload, isPending: sessionPending, refetch: refetchSession } = useSession();

  const user = sessionPayload?.user as AuthUser | undefined;

  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [publicSlugDraft, setPublicSlugDraft] = useState("");
  const [profileImageDraft, setProfileImageDraft] = useState("");
  const [profileImageSaving, setProfileImageSaving] = useState(false);
  const [publicUrlOrigin, setPublicUrlOrigin] = useState("");
  const profileImageFileInputRef = useRef<HTMLInputElement | null>(null);

  const utils = trpc.useUtils();
  const presenceQuery = trpc.profile.getPublicBookingPresence.useQuery(undefined, {
    enabled: Boolean(user?.id),
  });

  const updateProfileBasicsMutation = trpc.profile.updateProfileBasics.useMutation({
    onSuccess: async () => {
      await utils.publicBooking.getStorefront.invalidate();
    },
    onError: () => {
      toast.error(t("profile.errors.profileUpdate"));
    },
  });

  const updateProfileAvatarMutation = trpc.profile.updateProfileAvatar.useMutation();

  const slugMutation = trpc.profile.updatePublicBookingPresence.useMutation({
    onSuccess: () => {
      toast.success(t("profile.publicBooking.toastSlugSaved"));
      void presenceQuery.refetch();
    },
    onError: (e) => {
      if (e instanceof TRPCClientError) {
        const msg = e.message;
        if (msg === "SLUG_RESERVED") {
          toast.error(t("profile.publicBooking.errors.reserved"));
          return;
        }
        if (msg === "SLUG_ALREADY_TAKEN") {
          toast.error(t("profile.publicBooking.errors.taken"));
          return;
        }
      }
      toast.error(t("profile.publicBooking.errors.generic"));
    },
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPublicUrlOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!presenceQuery.data) {
      return;
    }
    setPublicSlugDraft(presenceQuery.data.publicBookingSlug ?? "");
    setProfileImageDraft(presenceQuery.data.image ?? "");
  }, [presenceQuery.data]);

  const profileSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, { message: t("profile.validation.nameRequired") }),
        bio: z.string().max(4000).optional(),
        defaultAddress: z.string().max(500).optional(),
        publicBookingMinNoticeHours: z.coerce.number().int().min(0).max(168),
      }),
    [t],
  );

  type ProfileFormValues = z.infer<typeof profileSchema>;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", bio: "", defaultAddress: "", publicBookingMinNoticeHours: 0 },
  });

  useEffect(() => {
    if (!user) {
      return;
    }
    profileForm.reset({
      name: user.name ?? "",
      bio: user.bio ?? "",
      defaultAddress: presenceQuery.data?.defaultAddress ?? "",
      publicBookingMinNoticeHours: presenceQuery.data?.publicBookingMinNoticeHours ?? 0,
    });
  }, [user?.id, user?.name, user?.bio, profileForm, presenceQuery.data?.defaultAddress, presenceQuery.data?.publicBookingMinNoticeHours]);

  const archiveSchema = useMemo(
    () =>
      z.object({
        confirmEmail: z.string().email({ message: t("login.validation.emailInvalid") }),
        password: z.string().optional(),
      }),
    [t],
  );

  type ArchiveFormValues = z.infer<typeof archiveSchema>;

  const archiveForm = useForm<ArchiveFormValues>({
    resolver: zodResolver(archiveSchema),
    defaultValues: { confirmEmail: "", password: "" },
  });

  const archiveMutation = trpc.profile.archiveAccount.useMutation({
    onSuccess: async () => {
      clearAdminAuthBridgeCookie();
      await signOut();
      if (typeof window !== "undefined") {
        window.location.replace("/admin/signin");
      }
    },
  });

  const onProfileSubmit = profileForm.handleSubmit(async (values) => {
    try {
      await updateProfileBasicsMutation.mutateAsync({
        name: values.name.trim(),
        bio: values.bio?.trim().length ? values.bio.trim() : null,
        defaultAddress: values.defaultAddress?.trim().length ? values.defaultAddress.trim() : null,
        publicBookingMinNoticeHours: values.publicBookingMinNoticeHours,
      });
      await refetchSession();
      toast.success(t("profile.toast.profileUpdated"));
    } catch {
      /* toast in mutation onError */
    }
  });

  const onArchiveSubmit = archiveForm.handleSubmit(async (values) => {
    archiveForm.clearErrors("root");
    try {
      await archiveMutation.mutateAsync({
        confirmEmail: values.confirmEmail,
        password: values.password?.length ? values.password : undefined,
      });
    } catch (e) {
      let code = "generic";
      if (e instanceof TRPCClientError) {
        const msg = e.message;
        if (ARCHIVE_ERROR_CODES.has(msg)) {
          code = msg;
        }
      }
      archiveForm.setError("root", {
        message: mapArchiveTrpcMessage({ code, t }),
      });
    }
  });

  const handleSavePublicSlug = async () => {
    const raw = publicSlugDraft.trim().toLowerCase();
    await slugMutation.mutateAsync({ publicBookingSlug: raw.length === 0 ? "" : raw });
  };

  const handleProfileImageFileChange = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("profile.publicBooking.imageInvalidType"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("profile.publicBooking.imageTooLarge"));
      return;
    }
    const reader = new FileReader();
    const result = await new Promise<string>((resolve) => {
      reader.onload = () => {
        resolve(typeof reader.result === "string" ? reader.result : "");
      };
      reader.readAsDataURL(file);
    });
    if (result.length === 0) {
      return;
    }
    setProfileImageDraft(result);
    setProfileImageSaving(true);
    try {
      await applyProfileImageToAccount(result);
    } finally {
      setProfileImageSaving(false);
      if (profileImageFileInputRef.current) {
        profileImageFileInputRef.current.value = "";
      }
    }
  };

  const applyProfileImageToAccount = async (imageValue: string) => {
    try {
      await updateProfileAvatarMutation.mutateAsync({
        image: imageValue.trim().length === 0 ? null : imageValue.trim(),
      });
      toast.success(t("profile.publicBooking.toastImageSaved"));
      await refetchSession();
      void presenceQuery.refetch();
      await utils.publicBooking.getStorefront.invalidate();
      return true;
    } catch {
      toast.error(t("profile.errors.profileUpdate"));
      return false;
    }
  };

  const handleRemoveProfileImage = async () => {
    setProfileImageSaving(true);
    try {
      const ok = await applyProfileImageToAccount("");
      if (ok) {
        setProfileImageDraft("");
        if (profileImageFileInputRef.current) {
          profileImageFileInputRef.current.value = "";
        }
      }
    } finally {
      setProfileImageSaving(false);
    }
  };

  const upcomingInvoice = useMemo(
    () => ({
      amount: "$49.00",
      date: locale === "fr" ? "28 avril 2026" : "April 28, 2026",
      plan: t("profile.billing.plan.name"),
    }),
    [locale, t],
  );

  const paymentHistory = useMemo(
    () => [
      {
        id: "next_payment",
        amount: upcomingInvoice.amount,
        date: upcomingInvoice.date,
        statusKey: "upcoming",
        isUpcoming: true,
      },
      {
        id: "inv_2026_04",
        amount: "$49.00",
        date: locale === "fr" ? "28 mars 2026" : "March 28, 2026",
        statusKey: "paid",
        isUpcoming: false,
      },
      {
        id: "inv_2026_03",
        amount: "$49.00",
        date: locale === "fr" ? "28 février 2026" : "February 28, 2026",
        statusKey: "paid",
        isUpcoming: false,
      },
      {
        id: "inv_2026_02",
        amount: "$49.00",
        date: locale === "fr" ? "28 janvier 2026" : "January 28, 2026",
        statusKey: "paid",
        isUpcoming: false,
      },
    ],
    [locale, upcomingInvoice.amount, upcomingInvoice.date],
  );

  const billingPaymentHistorySection = (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Receipt className="h-5 w-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">{t("profile.billing.history.title")}</h3>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-2.5 font-medium text-slate-600">
                {t("profile.billing.history.columns.date")}
              </th>
              <th className="px-4 py-2.5 font-medium text-slate-600">
                {t("profile.billing.history.columns.amount")}
              </th>
              <th className="px-4 py-2.5 font-medium text-slate-600">
                {t("profile.billing.history.columns.status")}
              </th>
              <th className="px-4 py-2.5 text-right font-medium text-slate-600">
                {t("profile.billing.history.columns.invoice")}
              </th>
            </tr>
          </thead>
          <tbody>
            {paymentHistory.map((payment) => {
              const statusLabel = t(`profile.billing.history.status.${payment.statusKey}`);

              return (
                <tr key={payment.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 text-slate-700">{payment.date}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{payment.amount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={payment.isUpcoming ? "secondary" : "outline"}>{statusLabel}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {payment.isUpcoming ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      <Button variant="link" size="sm" className="h-auto p-0 text-blue-600">
                        {t("profile.billing.history.download")}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const billingStatusBadge = (
    <Badge variant="secondary" className="capitalize">
      {t("profile.billing.status.active")}
    </Badge>
  );

  const billingOverview = (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3">
              <CreditCard className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {t("profile.billing.title")}
              </CardTitle>
              <CardDescription>{t("profile.billing.subtitle")}</CardDescription>
            </div>
          </div>
        </div>
        {billingStatusBadge}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">{t("profile.billing.plan.label")}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {t("profile.billing.plan.name")}
            </p>
            <p className="text-sm text-slate-600">{t("profile.billing.plan.description")}</p>
            <Button variant="outline" size="sm" className="mt-3">
              {t("profile.billing.plan.change")}
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">{t("profile.billing.payment.method")}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Visa •••• 4242</p>
            <p className="text-sm text-slate-600">{t("profile.billing.card.expires")}</p>
            <Button variant="outline" size="sm" className="mt-3">
              {t("profile.billing.payment.change")}
            </Button>
          </div>
        </div>

        {billingPaymentHistorySection}
      </CardContent>
    </Card>
  );

  const watchedProfileName = profileForm.watch("name");

  const profileInitials = useMemo(() => {
    const nameValue = (watchedProfileName ?? user?.name ?? "").trim();
    if (nameValue.length === 0) {
      return "U";
    }
    const parts = nameValue.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return (parts[0] ?? "").slice(0, 2).toUpperCase();
    }
    const first = parts[0] ?? "";
    const second = parts[1] ?? "";
    return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase();
  }, [watchedProfileName, user?.name]);

  const isProfileAvatarDisabled =
    sessionPending || !user || presenceQuery.isLoading || profileImageSaving;

  const profileAvatarMedia = profileImageDraft.trim().length > 0 ? (
    <img
      src={profileImageDraft}
      alt={t("profile.publicBooking.imagePreviewAlt")}
      className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
    />
  ) : (
    <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-700 transition duration-200 group-hover:text-slate-900">
      {profileInitials}
    </span>
  );

  const profileAvatarUploadOverlay = (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-full bg-slate-900/55 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
      aria-hidden
    >
      <Upload className="size-6 text-white drop-shadow-sm" />
      <span className="sr-only">{t("profile.publicBooking.imageClickToUpload")}</span>
    </div>
  );

  const profileAvatarSavingOverlay = profileImageSaving ? (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-full bg-slate-900/35"
      aria-hidden
    >
      <span className="size-7 animate-spin rounded-full border-2 border-white/30 border-t-white" />
    </div>
  ) : null;

  const profileImageAvatarButton = (
    <button
      type="button"
      className="group relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm transition hover:border-blue-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:shadow-sm"
      onClick={() => {
        profileImageFileInputRef.current?.click();
      }}
      disabled={isProfileAvatarDisabled}
      aria-label={t("profile.publicBooking.imageLabel")}
      aria-busy={profileImageSaving}
      title={isProfileAvatarDisabled && !profileImageSaving ? undefined : t("profile.publicBooking.imageClickToUpload")}
    >
      {profileAvatarMedia}
      {profileAvatarSavingOverlay}
      {!isProfileAvatarDisabled ? profileAvatarUploadOverlay : null}
    </button>
  );

  const hiddenProfileImageFileInput = (
    <Input
      ref={profileImageFileInputRef}
      id="profile-image-file"
      type="file"
      accept="image/*"
      disabled={sessionPending || !user || presenceQuery.isLoading || profileImageSaving}
      className="sr-only"
      onChange={(e) => {
        void handleProfileImageFileChange(e.target.files?.[0] ?? null);
      }}
    />
  );

  const profileImageFieldBlock = (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="profile-image-file">{t("profile.publicBooking.imageLabel")}</Label>
        <Upload className="h-4 w-4 text-slate-500" aria-hidden />
      </div>
      <div className="flex items-center gap-4">
        {profileImageAvatarButton}
        <div className="space-y-1">
          <p className="text-sm text-slate-700">{t("profile.publicBooking.imageHelp")}</p>
          <p className="text-xs text-slate-500">{t("profile.publicBooking.imageFileHint")}</p>
        </div>
      </div>
      {hiddenProfileImageFileInput}
    </div>
  );

  const renderProfileInformationSection = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            {t("profile.information")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...profileForm}>
          <form onSubmit={onProfileSubmit} className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <Label htmlFor="profile-name">{t("profile.full.name")}</Label>
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        id="profile-name"
                        type="text"
                        disabled={sessionPending || !user}
                        className="h-11 border-slate-300 bg-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <Label htmlFor="profile-email">{t("profile.email")}</Label>
              <Input
                id="profile-email"
                type="email"
                value={user?.email ?? ""}
                readOnly
                disabled
                className="h-11 border-slate-300 bg-slate-100 text-slate-600"
              />
              <p className="text-sm text-slate-500">{t("profile.emailReadOnlyHelp")}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <Label htmlFor="profile-default-address">{t("profile.defaultAddress.label")}</Label>
              <Input
                id="profile-default-address"
                type="text"
                disabled={sessionPending || !user}
                className="h-11 border-slate-300 bg-white"
                value={profileForm.watch("defaultAddress") ?? ""}
                onChange={(event) => {
                  profileForm.setValue("defaultAddress", event.target.value, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }}
              />
              <p className="text-sm text-slate-500">{t("profile.defaultAddress.hint")}</p>
            </div>

            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-indigo-50 p-3">
                  <Link2 className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{t("profile.publicBooking.title")}</h3>
                  <p className="text-sm text-slate-500">{t("profile.publicBooking.subtitle")}</p>
                </div>
              </div>
              {publicSlugFieldBlock}
              {publicUrlPreviewBlock}
              {saveSlugButtonOutsideBlock}
              {publicBookingMinNoticeHoursFieldBlock}
              {publicBookingBioFieldBlock}
              {profileImageFieldBlock}
              {saveImageButtonBlock}
            </div>

            <Button
              type="submit"
              disabled={sessionPending || !user}
              pending={profileForm.formState.isSubmitting}
              pendingChildren={t("profile.save.pending")}
            >
              <Save className="h-4 w-4" />
              {t("profile.save.changes")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const publicSlugSegment = publicSlugDraft.trim().toLowerCase();
  const fullPublicBookingUrl =
    publicUrlOrigin && publicSlugSegment.length > 0 ? `${publicUrlOrigin}/${publicSlugSegment}` : "";

  const publicSlugFieldBlock = (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <Label htmlFor="public-booking-slug">{t("profile.publicBooking.slugLabel")}</Label>
      <Input
        id="public-booking-slug"
        value={publicSlugDraft}
        onChange={(e) => setPublicSlugDraft(e.target.value)}
        disabled={sessionPending || !user || presenceQuery.isLoading}
        className="h-11 border-slate-300 bg-white font-mono text-sm"
        autoComplete="off"
        spellCheck={false}
      />
      <p className="text-sm text-slate-500">{t("profile.publicBooking.slugHelp")}</p>
    </div>
  );

  const saveSlugButtonElement = (
    <Button
      type="button"
      variant="secondary"
      disabled={sessionPending || !user || presenceQuery.isLoading}
      pending={slugMutation.isPending}
      pendingChildren={t("profile.save.pending")}
      onClick={() => {
        void handleSavePublicSlug();
      }}
    >
      {t("profile.publicBooking.slugSave")}
    </Button>
  );

  const publicUrlPreviewBlock =
    fullPublicBookingUrl.length > 0 ? (
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-800">{t("profile.publicBooking.publicUrl")}</p>
            <Link
              href={`/${publicSlugSegment}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all text-blue-700 hover:underline"
            >
              {fullPublicBookingUrl}
            </Link>
          </div>
          <div className="flex shrink-0 sm:justify-end">{saveSlugButtonElement}</div>
        </div>
      </div>
    ) : null;

  const saveSlugButtonOutsideBlock =
    fullPublicBookingUrl.length === 0 ? <div className="flex justify-end">{saveSlugButtonElement}</div> : null;

  const publicBookingMinNoticeHoursFieldBlock = (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <Label htmlFor="public-booking-min-notice-hours">{t("profile.publicBooking.minNoticeHours.label")}</Label>
      <Input
        id="public-booking-min-notice-hours"
        type="number"
        min={0}
        max={168}
        step={1}
        disabled={sessionPending || !user}
        className="h-11 border-slate-300 bg-white"
        value={profileForm.watch("publicBookingMinNoticeHours")}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          profileForm.setValue("publicBookingMinNoticeHours", Number.isNaN(parsed) ? 0 : parsed, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
        }}
      />
      <p className="text-sm text-slate-500">{t("profile.publicBooking.minNoticeHours.hint")}</p>
    </div>
  );

  const bioFieldErrorMessage = profileForm.formState.errors.bio?.message;

  const publicBookingBioFieldBlock = (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <Label htmlFor="profile-bio">{t("profile.bioTitle")}</Label>
      <Textarea
        id="profile-bio"
        rows={5}
        placeholder={t("profile.bio.placeholder")}
        disabled={sessionPending || !user}
        className="border-slate-300 bg-white"
        value={profileForm.watch("bio") ?? ""}
        onChange={(event) => {
          profileForm.setValue("bio", event.target.value, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
        }}
      />
      {bioFieldErrorMessage ? <p className="text-sm font-medium text-destructive">{bioFieldErrorMessage}</p> : null}
      <p className="text-sm text-slate-500">{t("profile.bio.publicHint")}</p>
    </div>
  );

  const saveImageButtonBlock = (
    <div className="flex flex-wrap items-center gap-2">
      {profileImageDraft.trim().length > 0 ? (
        <Button
          type="button"
          variant="ghost"
          className="text-slate-600"
          disabled={sessionPending || !user || presenceQuery.isLoading || profileImageSaving}
          onClick={() => {
            void handleRemoveProfileImage();
          }}
        >
          {t("profile.publicBooking.imageRemove")}
        </Button>
      ) : null}
    </div>
  );

  const languageSelectBlock = (
    <div className="space-y-2">
      <Label htmlFor="language-select">{t("profile.language")}</Label>
      <Select value={locale} onValueChange={(value) => setLocale(value as "fr" | "en")}>
        <SelectTrigger id="language-select" className="h-11 border-slate-300 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white border-slate-300 shadow-lg">
          <SelectItem value="fr">{t("language.fr")}</SelectItem>
          <SelectItem value="en">{t("language.en")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const emailNotificationsIcon = (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
      <Mail className="h-5 w-5 text-slate-600" aria-hidden />
    </div>
  );

  const emailNotificationsCopy = (
    <div className="min-w-0 flex-1 space-y-1">
      <Label htmlFor="email-notifications" className="cursor-pointer text-base font-medium text-slate-900">
        {t("profile.notificationsTitle")}
      </Label>
      <p className="text-sm text-slate-600">{t("profile.notifications.desc")}</p>
    </div>
  );

  const emailNotificationsToggle = (
    <Switch
      id="email-notifications"
      checked={emailNotificationsEnabled}
      onCheckedChange={setEmailNotificationsEnabled}
      aria-label={t("profile.notifications.toggleAriaLabel")}
    />
  );

  const emailNotificationsRow = (
    <div className="space-y-2">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
        {emailNotificationsIcon}
        {emailNotificationsCopy}
        <div className="flex shrink-0 items-center self-center pl-2">{emailNotificationsToggle}</div>
      </div>
      <p className="text-xs text-slate-500">{t("profile.notifications.notPersistedHint")}</p>
    </div>
  );

  const preferencesSection = (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-slate-900">
          {t("profile.preferences")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {languageSelectBlock}
        {emailNotificationsRow}
      </CardContent>
    </Card>
  );

  const dangerZoneSection = (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-red-600" />
          <CardTitle className="text-2xl font-bold text-red-900">
            {t("profile.danger.zone")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-red-700">{t("profile.danger.warning")}</p>
      </CardContent>
      <CardFooter>
        <AlertDialog
          onOpenChange={(open) => {
            if (!open) {
              archiveForm.reset({ confirmEmail: "", password: "" });
              archiveForm.clearErrors("root");
            }
          }}
        >
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="bg-red-600 text-white hover:bg-red-700">
              {t("profile.delete.account")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("profile.archive.title")}</AlertDialogTitle>
              <AlertDialogDescription>{t("profile.archive.description")}</AlertDialogDescription>
            </AlertDialogHeader>
            <Form {...archiveForm}>
              <form onSubmit={onArchiveSubmit} className="space-y-4 py-2">
                <FormField
                  control={archiveForm.control}
                  name="confirmEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.archive.confirmEmailLabel")}</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="off" disabled={archiveMutation.isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={archiveForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.archive.passwordLabel")}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          disabled={archiveMutation.isPending}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-sm text-slate-500">{t("profile.archive.passwordHint")}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {archiveForm.formState.errors.root?.message != null ? (
                  <p className="text-sm text-red-600">{archiveForm.formState.errors.root.message}</p>
                ) : null}
                <AlertDialogFooter>
                  <AlertDialogCancel type="button" disabled={archiveMutation.isPending}>
                    {t("profile.archive.cancel")}
                  </AlertDialogCancel>
                  <Button
                    type="submit"
                    variant="destructive"
                    className="bg-red-600 text-white hover:bg-red-700"
                    disabled={archiveMutation.isPending}
                  >
                    {t("profile.archive.submit")}
                  </Button>
                </AlertDialogFooter>
              </form>
            </Form>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );

  if (sessionPending) {
    return (
      <div className="p-8">
        <p className="text-slate-600">{t("profile.loading")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <p className="text-slate-600">{t("profile.sessionRequired")}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {t("profile.title")}
        </h1>
        <p className="text-slate-600">{t("profile.subtitle")}</p>
      </div>

      <div className="w-full space-y-6">
        {renderProfileInformationSection()}
        {preferencesSection}
        {billingOverview}
        {dangerZoneSection}
      </div>
    </div>
  );
}
