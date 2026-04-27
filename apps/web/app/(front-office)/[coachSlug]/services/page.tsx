"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Clock, ImageIcon, Package } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { BackButton } from "../../_components/BackButton";
import { FrontOfficePageLayout } from "../../_components/FrontOfficePageLayout";
import { PublicCoachBanner } from "../../_components/PublicCoachBanner";
import { trpc } from "@web/libs/trpc-client";
import { getCalendarWeekDates } from "#/utils/booking-page-calendar";
import { BOOKIDO_PUBLIC_SERVICES_BACK_FROM_HOME_KEY } from "#/utils/public-storefront-nav-origin";

function slugLooksValid(slug: string) {
  return slug.length >= 2 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug);
}

export default function ServicesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const coachSlug = typeof params["coachSlug"] === "string" ? params["coachSlug"] : "";
  const slugOk = slugLooksValid(coachSlug);

  const [showBackToSiteHome, setShowBackToSiteHome] = useState(false);
  useLayoutEffect(() => {
    try {
      setShowBackToSiteHome(sessionStorage.getItem(BOOKIDO_PUBLIC_SERVICES_BACK_FROM_HOME_KEY) === "1");
    } catch {
      setShowBackToSiteHome(false);
    }
  }, [pathname]);

  const [weekAnchor] = useState(() => new Date());

  const weekDates = useMemo(() => getCalendarWeekDates(weekAnchor), [weekAnchor]);
  const rangeInput = useMemo(() => {
    const d0 = weekDates[0]!;
    const d6 = weekDates[6]!;
    const from = new Date(d0);
    from.setHours(0, 0, 0, 0);
    const to = new Date(d6);
    to.setHours(23, 59, 59, 999);
    return { rangeFrom: from.toISOString(), rangeTo: to.toISOString() };
  }, [weekDates]);

  const storefrontQuery = trpc.publicBooking.getStorefront.useQuery(
    {
      coachSlug: coachSlug.toLowerCase(),
      rangeFrom: rangeInput.rangeFrom,
      rangeTo: rangeInput.rangeTo,
    },
    { enabled: slugOk, retry: false },
  );

  const services = storefrontQuery.data?.services ?? [];
  const coach = storefrontQuery.data?.coach ?? null;
  const priceFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }),
    [locale],
  );

  const invalidSlugBlock = (
    <div className="max-w-lg mx-auto rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-950">
      <p className="font-medium">{t("public.booking.invalidSlugTitle")}</p>
    </div>
  );

  const coachNotFoundBlock = (
    <div className="max-w-lg mx-auto rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-950">
      <p className="font-medium">{t("public.booking.coachNotFoundTitle")}</p>
      <p className="mt-2 text-sm text-amber-900/90">{t("public.booking.coachNotFoundHint")}</p>
    </div>
  );

  const loadingBlock = (
    <div className="flex justify-center py-24">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
    </div>
  );

  const errorBlock = (
    <div className="max-w-lg mx-auto rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-900">
      <p>{t("public.services.loadError")}</p>
    </div>
  );

  const emptyBlock = (
    <div className="max-w-lg mx-auto rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-700">
      <p>{t("public.services.empty")}</p>
    </div>
  );

  const coachBannerBlock =
    coach && !storefrontQuery.isLoading ? (
      <PublicCoachBanner name={coach.name} bio={coach.bio} imageUrl={coach.imageUrl} />
    ) : null;

  const serviceGrid = (
    <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
      {services.map((service, index) => {
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
          <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:mb-4">
            <img
              src={service.imageUrl}
              alt={service.name}
              className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] sm:h-32 md:h-36"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="mb-3 flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 sm:mb-4 sm:h-32 md:h-36">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="h-4 w-4" />
              <span>{service.name}</span>
            </div>
          </div>
        );

        const mobileCard = (
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:hidden">
            <div className="flex items-start gap-3">
              {mobileMedia}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-slate-900">{service.name}</h3>
                    {service.description ? <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{service.description}</p> : null}
                  </div>
                  <Link
                    href={`/${coachSlug}/booking?service=${encodeURIComponent(service.id)}`}
                    className="inline-flex shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    {t("public.hero.cta")}
                  </Link>
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
          <div className="group hidden h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all duration-300 ease-out hover:border-blue-300 hover:bg-blue-50/40 md:flex md:p-6">
            {desktopMedia}
            <h3 className="mb-1.5 text-lg font-bold text-slate-900 sm:text-xl">{service.name}</h3>
            {service.description ? (
              <p className="mb-3 line-clamp-2 text-sm text-slate-600 sm:mb-4 sm:line-clamp-3">{service.description}</p>
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
            <Link
              href={`/${coachSlug}/booking?service=${encodeURIComponent(service.id)}`}
              className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:px-5 sm:py-3 sm:text-base"
            >
              {t("public.hero.cta")}
            </Link>
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

  const mainContent = !slugOk ? (
    invalidSlugBlock
  ) : storefrontQuery.isLoading ? (
    loadingBlock
  ) : storefrontQuery.isError && storefrontQuery.error?.data?.httpStatus === 404 ? (
    coachNotFoundBlock
  ) : storefrontQuery.isError ? (
    errorBlock
  ) : services.length === 0 ? (
    emptyBlock
  ) : (
    serviceGrid
  );

  const topBackAction = showBackToSiteHome ? (
    <BackButton label={t("common.back")} fallbackHref="/" />
  ) : null;

  return (
    <FrontOfficePageLayout
      rootClassName="min-h-screen bg-white px-4 py-6 sm:px-6 sm:py-8"
      topAction={topBackAction}
    >
      {coachBannerBlock}
      <div className="mb-5 text-center sm:mb-8">
        <h2 className="mb-2 text-3xl font-bold text-slate-900 sm:mb-3 sm:text-4xl">{t("public.services.title")}</h2>
        <p className="text-sm text-slate-600 sm:text-base">{t("public.hero.subtitle")}</p>
      </div>
      {mainContent}
    </FrontOfficePageLayout>
  );
}
