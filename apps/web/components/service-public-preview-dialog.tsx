"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { BackButton } from "#/app/(front-office)/_components/BackButton";
import { FrontOfficePageLayout } from "#/app/(front-office)/_components/FrontOfficePageLayout";
import { PublicBookingServiceIntroStep } from "#/components/public-storefront/public-booking-service-intro-step";
import { PublicServicesListingGrid } from "#/components/public-storefront/public-services-listing-grid";
import { Badge } from "#/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "#/components/ui/dialog";
import type {
  PublicStorefrontCoachCard,
  PublicStorefrontServiceCard,
} from "#/components/public-storefront/public-storefront-service.types";

export type ServicePublicPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachSlug: string;
  coach: PublicStorefrontCoachCard | null;
  draftServices: PublicStorefrontServiceCard[];
};

export function ServicePublicPreviewDialog(p: ServicePublicPreviewDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [step, setStep] = useState<"list" | "detail">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!p.open) {
      return;
    }
    setStep("list");
    setSelectedId(p.draftServices[0]?.id ?? null);
  }, [p.open, p.draftServices]);

  const selected = useMemo(
    () => p.draftServices.find((s) => s.id === selectedId) ?? p.draftServices[0] ?? null,
    [p.draftServices, selectedId],
  );

  const servicesHref = `/${p.coachSlug}/services`;

  const previewBanner = (
    <div className="flex flex-col gap-1 border-b border-amber-200/80 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="border-amber-300 bg-amber-100 text-amber-950">
          {t("services.preview.badge")}
        </Badge>
        <p className="text-xs font-medium text-amber-950 sm:text-sm">{t("services.preview.hint")}</p>
      </div>
    </div>
  );

  const listView = (
    <div className="space-y-6 px-4 pb-8 pt-4 sm:px-6">
      <div className="relative mx-auto mb-4 max-w-2xl text-center sm:mb-6">
        <div className="mb-3 inline-flex items-center rounded-full border border-blue-200/90 bg-blue-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-800 shadow-sm">
          {t("public.services.eyebrow")}
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t("public.services.title")}</h2>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">{t("public.hero.subtitle")}</p>
      </div>
      {p.draftServices.length === 0 ? (
        <p className="text-center text-sm text-slate-600">{t("public.services.empty")}</p>
      ) : (
        <PublicServicesListingGrid
          coachSlug={p.coachSlug}
          services={p.draftServices}
          locale={locale}
          listingCta="preview"
          onPreviewOpenService={(id) => {
            setSelectedId(id);
            setStep("detail");
          }}
        />
      )}
    </div>
  );

  const detailDesktopBack = (
    <div className="mb-4 hidden sm:block">
      <BackButton
        label={t("services.preview.backToList")}
        fallbackHref={servicesHref}
        onNavigate={() => setStep("list")}
      />
    </div>
  );

  const detailView =
    selected != null ? (
      <div className="px-0 pb-8 pt-2 sm:px-4">
        {detailDesktopBack}
        <PublicBookingServiceIntroStep
          service={selected}
          coach={p.coach}
          servicesHref={servicesHref}
          variant="preview"
          onPickSlot={() => {}}
          onMobileBack={() => setStep("list")}
          showShareButton={false}
          disableMobileFixedLayout
        />
      </div>
    ) : (
      <p className="p-6 text-center text-sm text-slate-600">{t("public.services.empty")}</p>
    );

  const shell = (
    <FrontOfficePageLayout topAction={null} contentClassName="mx-auto max-w-5xl px-0">
      {previewBanner}
      {step === "list" ? listView : detailView}
    </FrontOfficePageLayout>
  );

  return (
    <Dialog open={p.open} onOpenChange={p.onOpenChange}>
      <DialogContent className="max-h-[min(92vh,900px)] w-[min(100vw-1rem,1100px)] gap-0 overflow-hidden p-0 sm:max-w-[min(100vw-2rem,1100px)]">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("services.preview.dialogTitle")}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[min(92vh,900px)] overflow-y-auto">{shell}</div>
      </DialogContent>
    </Dialog>
  );
}
