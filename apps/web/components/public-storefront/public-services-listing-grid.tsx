"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "motion/react";
import { Clock, ImageIcon, Package } from "lucide-react";
import { useTranslations } from "next-intl";

import { PublicServiceBookingImage } from "#/components/public-service-booking-image";
import { plainTextFromHtml } from "#/utils/rich-text-plain";
import type { PublicStorefrontServiceCard } from "#/components/public-storefront/public-storefront-service.types";

export type PublicServicesListingGridProps = {
  coachSlug: string;
  services: PublicStorefrontServiceCard[];
  locale: string;
  listingCta: "book" | "preview";
  onPreviewOpenService?: (serviceId: string) => void;
};

export function PublicServicesListingGrid(p: PublicServicesListingGridProps) {
  const t = useTranslations();
  const priceFormatter = useMemo(
    () => new Intl.NumberFormat(p.locale, { style: "currency", currency: "EUR" }),
    [p.locale],
  );

  const serviceGrid = (
    <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
      {p.services.map((service, index) => {
        const descriptionPreview = plainTextFromHtml(service.description ?? "").trim();
        const priceLabel =
          service.isFree || service.price <= 0 ? t("public.booking.free") : priceFormatter.format(service.price);
        const durationLabel = t("public.services.durationMinutes", { minutes: service.durationMinutes });
        const packLabel = t("public.services.packSessions", { count: service.packSize });
        const mobileMedia = service.imageUrl ? (
          <img src={service.imageUrl} alt={service.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" loading="lazy" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-400">
            <ImageIcon className="h-4 w-4" />
          </div>
        );
        const desktopMedia = service.imageUrl ? (
          <div className="group mb-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:mb-4">
            <PublicServiceBookingImage
              imageUrl={service.imageUrl}
              alt={service.name}
              loading="lazy"
              imgClassName="transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        ) : (
          <div className="mb-3 flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 sm:mb-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="h-4 w-4" />
              <span>{service.name}</span>
            </div>
          </div>
        );

        const ctaBook = (
          <Link
            href={`/${p.coachSlug}/booking?service=${encodeURIComponent(service.id)}`}
            className="inline-flex shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 md:inline-flex md:justify-center md:rounded-lg md:px-4 md:py-2.5 md:text-sm"
          >
            {t("public.hero.cta")}
          </Link>
        );

        const ctaPreview = (
          <button
            type="button"
            onClick={() => p.onPreviewOpenService?.(service.id)}
            className="inline-flex shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 md:inline-flex md:w-full md:justify-center md:px-4 md:py-2.5 md:text-sm"
          >
            {t("services.preview.viewDetails")}
          </button>
        );

        const mobileCard = (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-md ring-1 ring-slate-900/[0.03] md:hidden">
            <div className="flex items-start gap-3">
              {mobileMedia}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-slate-900">{service.name}</h3>
                    {descriptionPreview ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{descriptionPreview}</p>
                    ) : null}
                  </div>
                  {p.listingCta === "book" ? ctaBook : ctaPreview}
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {durationLabel}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 shrink-0" />
                      {packLabel}
                    </span>
                  </div>
                  <span className="shrink-0 text-base font-bold text-slate-900">{priceLabel}</span>
                </div>
              </div>
            </div>
          </div>
        );

        const desktopCard = (
          <div className="group hidden h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-md ring-1 ring-slate-900/[0.03] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-blue-300/80 hover:shadow-lg md:flex md:p-6">
            {desktopMedia}
            <h3 className="mb-1.5 text-lg font-bold text-slate-900 sm:text-xl">{service.name}</h3>
            {descriptionPreview ? (
              <p className="mb-3 line-clamp-2 text-sm text-slate-600 sm:mb-4 sm:line-clamp-3">{descriptionPreview}</p>
            ) : null}
            <div className="mt-auto mb-4 flex flex-wrap items-center justify-between gap-3 text-slate-600 sm:mb-5">
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                <span className="inline-flex items-center gap-2 text-sm sm:text-base">
                  <Clock className="h-4 w-4 shrink-0" />
                  {durationLabel}
                </span>
                <span className="inline-flex items-center gap-2 text-sm sm:text-base">
                  <Package className="h-4 w-4 shrink-0" />
                  {packLabel}
                </span>
              </div>
              <span className="shrink-0 text-xl font-bold text-slate-900 sm:text-2xl">{priceLabel}</span>
            </div>
            {p.listingCta === "book" ? (
              <Link
                href={`/${p.coachSlug}/booking?service=${encodeURIComponent(service.id)}`}
                className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:px-5 sm:py-3 sm:text-base"
              >
                {t("public.hero.cta")}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => p.onPreviewOpenService?.(service.id)}
                className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:px-5 sm:py-3 sm:text-base"
              >
                {t("services.preview.viewDetails")}
              </button>
            )}
          </div>
        );
        return (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
          >
            {mobileCard}
            {desktopCard}
          </motion.div>
        );
      })}
    </div>
  );

  return serviceGrid;
}
