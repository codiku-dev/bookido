"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Clock, ImageIcon } from "lucide-react";
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
    <div className="grid md:grid-cols-2 gap-6">
      {services.map((service, index) => {
        const priceLabel =
          service.isFree || service.price <= 0 ? t("public.booking.free") : priceFormatter.format(service.price);
        const durationLabel = t("public.services.durationMinutes", { minutes: service.durationMinutes });
        const serviceMedia = service.imageUrl ? (
          <div className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <img
              src={service.imageUrl}
              alt={service.name}
              className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="mb-5 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="h-4 w-4" />
              <span>{service.name}</span>
            </div>
          </div>
        );
        const card = (
          <div className="group text-left p-8 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 hover:scale-[1.005] transition-all duration-300 ease-out h-full flex flex-col">
            {serviceMedia}
            <h3 className="text-xl font-bold text-slate-900 mb-2">{service.name}</h3>
            {service.description ? (
              <p className="text-sm text-slate-600 mb-4 line-clamp-3">{service.description}</p>
            ) : null}
            <div className="flex items-center gap-6 text-slate-600 mb-6 mt-auto">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{durationLabel}</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">{priceLabel}</span>
            </div>
            <Link
              href={`/${coachSlug}/booking?service=${encodeURIComponent(service.id)}`}
              className="inline-flex justify-center px-5 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
            {card}
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
      rootClassName="min-h-screen bg-white py-12 px-6"
      topAction={topBackAction}
    >
      {coachBannerBlock}
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">{t("public.services.title")}</h2>
        <p className="text-slate-600">{t("public.hero.subtitle")}</p>
      </div>
      {mainContent}
    </FrontOfficePageLayout>
  );
}
