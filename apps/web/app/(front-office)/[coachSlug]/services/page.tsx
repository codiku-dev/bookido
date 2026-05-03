"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { BackButton } from "../../_components/BackButton";
import { FrontOfficePageLayout } from "../../_components/FrontOfficePageLayout";
import { PublicCoachBanner } from "../../_components/PublicCoachBanner";
import { PublicServicesListingGrid } from "#/components/public-storefront/public-services-listing-grid";
import { trpc } from "@web/libs/trpc-client";
import { isPublicCoachStorefrontNotFoundError } from "#/utils/trpc-public-coach-not-found";
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

  const invalidSlugBlock = (
    <div className="max-w-lg mx-auto rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-950">
      <p className="font-medium">{t("public.booking.invalidSlugTitle")}</p>
    </div>
  );

  const coachNotFoundBlock = (
    <div className="max-w-lg mx-auto rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-950">
      <p className="font-medium">{t("public.booking.coachNotFoundTitle")}</p>
      <Link
        href="/"
        className="mt-3 inline-block text-sm font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800"
      >
        {t("public.booking.coachNotFoundHome")}
      </Link>
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
    <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-blue-200/90 bg-white/90 p-8 text-center shadow-md ring-1 ring-slate-900/[0.03] backdrop-blur-sm">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md">
        <Sparkles className="h-6 w-6" aria-hidden />
      </div>
      <p className="text-sm font-medium text-slate-800 sm:text-base">{t("public.services.empty")}</p>
    </div>
  );

  const coachBannerBlock =
    coach && !storefrontQuery.isLoading ? (
      <PublicCoachBanner name={coach.name} bio={coach.bio} imageUrl={coach.imageUrl} />
    ) : null;

  const serviceGrid =
    services.length > 0 ? (
      <PublicServicesListingGrid coachSlug={coachSlug} services={services} locale={locale} listingCta="book" />
    ) : null;

  const mainContent = !slugOk ? (
    invalidSlugBlock
  ) : storefrontQuery.isLoading ? (
    loadingBlock
  ) : storefrontQuery.isError && isPublicCoachStorefrontNotFoundError(storefrontQuery.error) ? (
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

  const servicesSectionHeading = (
    <div className="relative mx-auto mb-8 max-w-2xl text-center sm:mb-10">
      <div className="mb-3 inline-flex items-center rounded-full border border-blue-200/90 bg-blue-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-800 shadow-sm">
        {t("public.services.eyebrow")}
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-[2.5rem] md:leading-tight">
        {t("public.services.title")}
      </h2>
      <p className="mt-3 text-sm text-slate-600 sm:text-base md:text-lg">{t("public.hero.subtitle")}</p>
    </div>
  );

  return (
    <FrontOfficePageLayout topAction={topBackAction}>
      {coachBannerBlock}
      {servicesSectionHeading}
      {mainContent}
    </FrontOfficePageLayout>
  );
}
