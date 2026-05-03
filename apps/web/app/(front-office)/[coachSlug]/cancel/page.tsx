"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { TRPCClientError } from "@trpc/client";

import { FrontOfficePageLayout } from "../../_components/FrontOfficePageLayout";
import { Button } from "#/components/ui/button";
import { CancelRefundPreviewPanel } from "#/components/cancellation/cancel-refund-preview-panel";
import { trpc } from "@web/libs/trpc-client";
import {
  formatRefundPreviewDateTime,
  formatRefundPreviewMoney,
  type CancellationRefundPreviewLocale,
} from "@web/utils/cancellation-refund-preview-format";

function mapTrpcToErrorKey(err: unknown): "expired" | "invalid" | "coachNotFound" | "loadError" | null {
  if (!err) {
    return null;
  }
  if (err instanceof TRPCClientError) {
    if (err.message === "CANCEL_TOKEN_EXPIRED") return "expired";
    if (err.message === "CANCEL_TOKEN_INVALID") return "invalid";
    if (err.message === "COACH_NOT_FOUND") return "coachNotFound";
  }
  return "loadError";
}

export default function PublicCancelBookingPage() {
  const t = useTranslations("public.cancelBooking");
  const locale = useLocale() as CancellationRefundPreviewLocale;
  const params = useParams<{ coachSlug: string }>();
  const searchParams = useSearchParams();
  const coachSlug = typeof params.coachSlug === "string" ? params.coachSlug : "";
  const token = (searchParams.get("t") ?? "").trim();

  const cancelMutation = trpc.publicBooking.cancelByToken.useMutation();

  const tokenOk = token.length >= 32;
  const slugOk = coachSlug.length >= 2;

  const previewEnabled = slugOk && tokenOk && !cancelMutation.isSuccess;
  const previewQuery = trpc.publicBooking.getCancelBookingPreview.useQuery(
    { coachSlug, token },
    { enabled: previewEnabled, retry: false },
  );

  const mutationErrorKey = useMemo(() => mapTrpcToErrorKey(cancelMutation.error), [cancelMutation.error]);
  const previewErrorKey = useMemo(() => mapTrpcToErrorKey(previewQuery.error), [previewQuery.error]);
  const blockingErrorKey = mutationErrorKey ?? previewErrorKey;

  const showSuccess =
    cancelMutation.isSuccess || (previewQuery.isSuccess && previewQuery.data?.alreadyCancelled === true);

  const successBody =
    cancelMutation.isSuccess && cancelMutation.data ? (
      cancelMutation.data.alreadyCancelled ? (
        <p className="text-center text-slate-600">{t("alreadyCancelled")}</p>
      ) : (
        <>
          <p className="text-center text-slate-600">{t("success")}</p>
          {cancelMutation.data.stripeRefunded ? (
            <p className="text-center text-sm text-slate-500">{t("successRefunded")}</p>
          ) : (
            <p className="text-center text-sm text-slate-500">{t("successNoRefund")}</p>
          )}
        </>
      )
    ) : previewQuery.data?.alreadyCancelled ? (
      <p className="text-center text-slate-600">{t("alreadyCancelled")}</p>
    ) : (
      <p className="text-center text-slate-600">{t("success")}</p>
    );

  const missingTokenBlock = (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-2 text-center text-xl font-semibold text-slate-900">{t("pageTitle")}</h1>
      <p className="text-center text-slate-600">{t("missingToken")}</p>
    </div>
  );

  const invalidSlugBlock = (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-2 text-center text-xl font-semibold text-slate-900">{t("invalidSlugTitle")}</h1>
      <p className="text-center text-slate-600">{t("invalidSlugBody")}</p>
    </div>
  );

  const refundPanel = (() => {
    if (previewQuery.isLoading && previewEnabled) {
      return <CancelRefundPreviewPanel className="mb-6" loading loadingText={t("previewLoading")} />;
    }
    const d = previewQuery.data;
    if (!previewQuery.isSuccess || !d || d.alreadyCancelled) {
      return null;
    }
    if (!d.hasOnlinePaidAmount) {
      return <CancelRefundPreviewPanel className="mb-6" freeMessage={t("refundHintFree")} />;
    }
    const amountStr = formatRefundPreviewMoney(locale, d.refundTotalPaid);
    const firstStr = formatRefundPreviewDateTime(locale, d.firstSessionStartsAt);
    const cutoffStr =
      d.refundPolicyCutoffAt !== null ? formatRefundPreviewDateTime(locale, d.refundPolicyCutoffAt) : null;
    return (
      <CancelRefundPreviewPanel
        className="mb-6"
        paid={{
          amountCaption: t("refundCardAmountCaption"),
          amountValue: amountStr,
          sessionCaption: t("refundCardSessionCaption"),
          sessionValue: firstStr,
          cutoffCaption: t("refundCardCutoffCaption"),
          cutoffValue: cutoffStr,
        }}
        verdict={{
          tone: d.onlineRefundWillApply ? "ok" : "warn",
          title: d.onlineRefundWillApply ? t("refundVerdictYesTitle") : t("refundVerdictNoTitle"),
          detail: d.onlineRefundWillApply ? t("refundVerdictYesDetail") : t("refundVerdictNoDetail"),
        }}
      />
    );
  })();

  const formBlock = (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-5 text-center text-xl font-semibold tracking-tight text-slate-900">{t("confirmQuestion")}</h1>
      {refundPanel}
      {blockingErrorKey ? (
        <p className="mb-4 text-center text-sm text-red-600">{t(`errors.${blockingErrorKey}`)}</p>
      ) : null}
      <Button
        type="button"
        className="h-11 w-full rounded-lg text-sm font-semibold"
        disabled={
          cancelMutation.isPending ||
          !tokenOk ||
          !slugOk ||
          (previewEnabled && previewQuery.isLoading && !previewQuery.isFetched)
        }
        onClick={() => {
          if (!tokenOk || !slugOk) return;
          cancelMutation.mutate({ coachSlug, token });
        }}
      >
        {cancelMutation.isPending ? t("confirming") : t("confirmCta")}
      </Button>
    </div>
  );

  const successBlock = (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-4 text-center text-xl font-semibold text-emerald-800">{t("successTitle")}</h1>
      {successBody}
      <div className="mt-8 flex justify-center">
        <Button asChild variant="outline" className="rounded-lg">
          <Link href="/">{t("backToHome")}</Link>
        </Button>
      </div>
    </div>
  );

  const mainContent = !slugOk ? (
    invalidSlugBlock
  ) : !tokenOk ? (
    missingTokenBlock
  ) : showSuccess ? (
    successBlock
  ) : (
    formBlock
  );

  return (
    <FrontOfficePageLayout rootClassName="min-h-screen bg-slate-50 px-6 py-12" topAction={null}>
      <div className="mx-auto max-w-lg pt-4">{mainContent}</div>
    </FrontOfficePageLayout>
  );
}
