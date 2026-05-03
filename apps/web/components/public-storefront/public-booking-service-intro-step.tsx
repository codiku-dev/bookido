"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, Clock, MapPin, Package, Share2 } from "lucide-react";

import { PublicCoachBanner } from "#/app/(front-office)/_components/PublicCoachBanner";
import { Button } from "#/components/ui/button";
import { PublicServiceBookingImage } from "#/components/public-service-booking-image";
import { SafeHtml } from "#/components/rich-text/safe-html";
import type {
  PublicStorefrontCoachCard,
  PublicStorefrontServiceCard,
} from "#/components/public-storefront/public-storefront-service.types";
import { addressToGoogleMapsSearchHref } from "#/utils/public-service-google-maps-href";

function publicBookingMobileHeroImageClass(heroSrc: string, serviceImageUrl: string | null | undefined) {
  const isServiceShot = Boolean(serviceImageUrl && heroSrc === serviceImageUrl);
  return isServiceShot
    ? "h-full w-full object-contain object-center bg-slate-100"
    : "h-full w-full object-cover object-center";
}

export type PublicBookingServiceIntroStepProps = {
  service: PublicStorefrontServiceCard;
  coach: PublicStorefrontCoachCard | null;
  /** Public services listing URL (live booking). */
  servicesHref: string;
  variant: "booking" | "preview";
  onPickSlot: () => void;
  /** When set, mobile header back uses this instead of navigating to `servicesHref`. */
  onMobileBack?: () => void;
  showShareButton?: boolean;
  /** Shown inside the mobile drawer when `variant` is `booking` (e.g. booking stepper). */
  bookingStepperSlot?: ReactNode;
  /** Use when rendering inside a modal: avoids `position: fixed` drawer clipping outside the dialog. */
  disableMobileFixedLayout?: boolean;
};

export function PublicBookingServiceIntroStep(p: PublicBookingServiceIntroStepProps) {
  const t = useTranslations();
  const locale = useLocale();
  const showShare = p.showShareButton !== false && p.variant === "booking";

  const [mobileHeroImageIndex, setMobileHeroImageIndex] = useState(0);

  const mobileHeroImageCandidates = useMemo(
    () =>
      [p.service.imageUrl ?? null, p.coach?.imageUrl ?? null].filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      ),
    [p.service.imageUrl, p.coach?.imageUrl],
  );

  useEffect(() => {
    setMobileHeroImageIndex(0);
  }, [p.service.id, p.service.imageUrl, p.coach?.imageUrl]);

  const priceFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }),
    [locale],
  );

  const priceLabel =
    p.service.isFree || p.service.price <= 0 ? t("public.booking.free") : priceFormatter.format(p.service.price);

  const servicePackSessionsLabel = t("public.services.packSessions", { count: p.service.packSize });

  const selectedServiceGoogleMapsHref = addressToGoogleMapsSearchHref(p.service.address);

  const mobileHeroClassName = "relative h-[30vh] min-h-56 overflow-hidden bg-slate-100";
  const hasMobileHeroImage = mobileHeroImageCandidates.length > 0;
  const mobileDrawerClassName = p.disableMobileFixedLayout
    ? "relative z-10 -mt-4 flex max-h-[min(70vh,520px)] flex-col overflow-hidden rounded-t-[28px] border border-slate-200/80 bg-white shadow-md"
    : "fixed inset-x-0 bottom-0 z-40 flex h-[70vh] -translate-y-[10vh] flex-col rounded-t-[28px] border-t border-slate-200/80 bg-white shadow-[0_-12px_48px_-12px_rgba(15,23,42,0.12)]";

  const bookingStepper = p.variant === "booking" ? p.bookingStepperSlot : null;

  const mobileNavButtonClass =
    "inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm ring-1 ring-slate-200/80";

  const mobileBackControl = p.onMobileBack ? (
    <button type="button" onClick={p.onMobileBack} className={mobileNavButtonClass} aria-label={t("common.back")}>
      <ChevronLeft className="size-5" />
    </button>
  ) : (
    <Link href={p.servicesHref} className={mobileNavButtonClass} aria-label={t("common.back")}>
      <ChevronLeft className="size-5" />
    </Link>
  );

  const mobileTopBar = (
    <div className="flex items-center justify-between gap-3">
      {mobileBackControl}
      {showShare ? (
        <button type="button" className={mobileNavButtonClass} aria-label={t("public.booking.share")}>
          <Share2 className="size-4.5" />
        </button>
      ) : (
        <span className="inline-flex h-10 w-10" aria-hidden />
      )}
    </div>
  );

  const mobileHeroSection = hasMobileHeroImage ? (
    <div className={`${mobileHeroClassName} md:hidden`}>
      <img
        src={mobileHeroImageCandidates[mobileHeroImageIndex]}
        alt={p.service.name}
        className={publicBookingMobileHeroImageClass(
          mobileHeroImageCandidates[mobileHeroImageIndex]!,
          p.service.imageUrl,
        )}
        onError={() => {
          setMobileHeroImageIndex((current) => {
            if (current >= mobileHeroImageCandidates.length - 1) {
              return current;
            }
            return current + 1;
          });
        }}
      />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-5">{mobileTopBar}</div>
    </div>
  ) : (
    <div className="border-b border-slate-200/80 bg-white px-4 pb-3 pt-4 md:hidden">{mobileTopBar}</div>
  );

  const pickSlotButton = (
    <Button
      type="button"
      className="w-full rounded-2xl py-6 text-base font-semibold"
      onClick={p.onPickSlot}
      disabled={p.variant === "preview"}
    >
      {p.variant === "preview" ? t("services.preview.pickSlotDisabled") : t("public.booking.pickSlotCta")}
    </Button>
  );

  const desktopPickRow = (
    <div className="flex flex-col gap-3 border-t border-slate-200/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-2xl font-bold tracking-tight text-blue-600">{priceLabel}</p>
      <Button
        type="button"
        className="h-10 w-full rounded-lg px-6 text-sm font-semibold sm:w-auto sm:min-w-[200px]"
        onClick={p.onPickSlot}
        disabled={p.variant === "preview"}
      >
        {p.variant === "preview" ? t("services.preview.pickSlotDisabled") : t("public.booking.pickSlotCta")}
      </Button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-3xl md:max-w-5xl">
      {mobileHeroSection}

      <div className={`${mobileDrawerClassName} md:hidden`}>
        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-4 pt-4">
          {bookingStepper}
          {p.coach ? <PublicCoachBanner name={p.coach.name} bio={p.coach.bio} imageUrl={p.coach.imageUrl} /> : null}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-2xl font-bold text-slate-900">{p.service.name}</p>
              {selectedServiceGoogleMapsHref.length > 0 ? (
                <a
                  href={selectedServiceGoogleMapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("public.booking.mapTitle")}
                  className="mt-1 block text-sm font-medium text-blue-600 underline-offset-2 hover:text-blue-800 hover:underline"
                >
                  {p.service.address}
                </a>
              ) : (
                <p className="mt-1 text-sm text-slate-500">{p.service.address}</p>
              )}
            </div>
            <p className="shrink-0 text-2xl font-bold text-slate-900">{priceLabel}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
              {t("public.booking.durationLabel", { minutes: p.service.durationMinutes })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
              <Package className="size-3.5 shrink-0 text-slate-500" />
              {servicePackSessionsLabel}
            </span>
          </div>

          <SafeHtml html={p.service.description} className="text-sm leading-relaxed text-slate-700" />
        </div>

        <div className="border-t border-slate-200 bg-white px-5 py-4">
          {p.variant === "preview" ? (
            <p className="mb-3 text-center text-xs text-slate-500">{t("services.preview.pickSlotHint")}</p>
          ) : null}
          {pickSlotButton}
        </div>
      </div>

      <div className="hidden md:block">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-lg shadow-slate-900/[0.05] ring-1 ring-slate-900/[0.03]">
          <div className="flex flex-col gap-4 bg-gradient-to-br from-slate-50/90 via-white to-blue-50/30 px-6 py-5 lg:px-8 lg:py-5">
            {p.coach ? <PublicCoachBanner name={p.coach.name} bio={p.coach.bio} imageUrl={p.coach.imageUrl} compact /> : null}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600">
                {t("public.booking.stepper.service")}
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 lg:text-2xl">{p.service.name}</h2>
              {(p.service.description ?? "").trim().length > 0 ? (
                <div className="mt-2 text-sm leading-snug text-slate-600">
                  <SafeHtml html={(p.service.description ?? "").trim()} />
                </div>
              ) : null}
            </div>

            {p.service.imageUrl?.trim() ? (
              <div className="overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/50">
                <PublicServiceBookingImage imageUrl={p.service.imageUrl.trim()} alt={p.service.name} />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-800">
                <Clock className="size-3.5 shrink-0 text-blue-600" />
                {t("public.booking.durationLabel", { minutes: p.service.durationMinutes })}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-800">
                <Package className="size-3.5 shrink-0 text-blue-600" />
                {servicePackSessionsLabel}
              </span>
              {selectedServiceGoogleMapsHref.length > 0 ? (
                <a
                  href={selectedServiceGoogleMapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("public.booking.mapTitle")}
                  className="inline-flex w-full max-w-full items-start gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-800 transition-colors hover:border-blue-300/80 hover:bg-blue-50/90 hover:text-blue-900 sm:w-auto"
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-blue-600" aria-hidden />
                  <span className="line-clamp-2">{p.service.address}</span>
                </a>
              ) : (
                <span className="inline-flex w-full max-w-full items-start gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-800 sm:w-auto">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-blue-600" aria-hidden />
                  <span className="line-clamp-2">{p.service.address}</span>
                </span>
              )}
            </div>

            {p.variant === "preview" ? (
              <p className="text-center text-xs text-slate-500">{t("services.preview.pickSlotHint")}</p>
            ) : null}
            {desktopPickRow}
          </div>
        </div>
      </div>
    </div>
  );
}
