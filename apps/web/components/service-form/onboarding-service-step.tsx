"use client";

import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { ServiceFormEditor } from "#/components/service-form/service-form-editor";
import type { PublicStorefrontCoachCard } from "#/components/public-storefront/public-storefront-service.types";
import type { ServiceFormValues } from "#/utils/service-form-schema";

export type OnboardingServiceStepProps = {
  form: UseFormReturn<ServiceFormValues>;
  googleMapsPlacesApiKey: string;
  isOutsideOpeningHours: (dayKey: string, time: string) => boolean;
  planningClosedSlotKeys: Set<string>;
  coachSlugForPublicPreview: string;
  coachCardForPublicPreview: PublicStorefrontCoachCard | null;
  editingServiceId?: string | null;
  stripeReadyForPaidPublish: boolean;
};

export function OnboardingServiceStep(p: OnboardingServiceStepProps) {
  const t = useTranslations();

  const headerBlock = (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("onboarding.service.title")}</h1>
      <p className="mt-2 text-slate-600">{t("onboarding.service.subtitle")}</p>
    </div>
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 md:px-8">
      {headerBlock}
      <ServiceFormEditor
        form={p.form}
        googleMapsPlacesApiKey={p.googleMapsPlacesApiKey}
        placesActive
        isOutsideOpeningHours={p.isOutsideOpeningHours}
        planningClosedSlotKeys={p.planningClosedSlotKeys}
        coachSlugForPublicPreview={p.coachSlugForPublicPreview}
        coachCardForPublicPreview={p.coachCardForPublicPreview}
        editingServiceId={p.editingServiceId}
        stripeReadyForPaidPublish={p.stripeReadyForPaidPublish}
        showAllowsDirectPayment={false}
        priceFieldLabel={t("onboarding.service.packTotalPriceLabel")}
        showOptionalImageHint
        availabilityInstructionsKey="onboarding.service.availabilityInstructions"
        visibilityBannerVariant="amber"
        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm md:p-6"
      />
    </div>
  );
}
