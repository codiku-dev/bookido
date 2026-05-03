import type { ReactNode } from "react";
import { AlertTriangle, Calendar, CheckCircle2, Clock, Euro, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Separator } from "#/components/ui/separator";
import { cn } from "@repo/ui/utils/cn";

export type CancelRefundPreviewPaid = {
  amountCaption: string;
  amountValue: string;
  sessionCaption: string;
  sessionValue: string;
  cutoffCaption: string;
  cutoffValue: string | null;
};

export type CancelRefundVerdict = {
  tone: "ok" | "warn";
  title: string;
  detail?: string;
};

function metaRow(p: { icon: ReactNode; caption: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">{p.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{p.caption}</p>
        <p className="text-sm font-medium leading-snug text-slate-900">{p.value}</p>
      </div>
    </div>
  );
}

export function CancelRefundPreviewPanel(p: {
  className?: string;
  loading?: boolean;
  loadingText?: string;
  freeMessage?: string;
  paid?: CancelRefundPreviewPaid;
  /** When false, only the amount + schedule block is shown (e.g. admin dialog adds verdict after the Stripe checkbox). */
  showVerdict?: boolean;
  verdict?: CancelRefundVerdict | null;
}) {
  const showVerdict = p.showVerdict !== false;

  const loadingBlock = (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/60 px-5 py-10">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden />
      <p className="text-center text-sm text-slate-600">{p.loadingText}</p>
    </div>
  );

  const freeBlock = (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-4 text-center text-sm leading-relaxed text-slate-600">
      {p.freeMessage}
    </div>
  );

  const verdictBlock =
    showVerdict && p.verdict ? (
      <>
        <Separator className="bg-slate-100" />
        <Alert
          className={cn(
            "border-0 shadow-none",
            p.verdict.tone === "ok"
              ? "bg-emerald-50/90 text-emerald-950 [&>svg]:text-emerald-600"
              : "bg-amber-50/90 text-amber-950 [&>svg]:text-amber-700",
          )}
        >
          {p.verdict.tone === "ok" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          )}
          <AlertTitle>{p.verdict.title}</AlertTitle>
          {p.verdict.detail ? <AlertDescription>{p.verdict.detail}</AlertDescription> : null}
        </Alert>
      </>
    ) : null;

  const paidBlock = p.paid ? (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-5 py-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-700">
            <Euro className="h-6 w-6" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{p.paid.amountCaption}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{p.paid.amountValue}</p>
          </div>
        </div>
      </div>
      <div className="space-y-4 px-5 py-5">
        {metaRow({
          icon: <Calendar className="h-4 w-4" aria-hidden />,
          caption: p.paid.sessionCaption,
          value: p.paid.sessionValue,
        })}
        {p.paid.cutoffValue ? (
          metaRow({
            icon: <Clock className="h-4 w-4" aria-hidden />,
            caption: p.paid.cutoffCaption,
            value: p.paid.cutoffValue,
          })
        ) : null}
        {verdictBlock}
      </div>
    </div>
  ) : null;

  const body = p.loading ? loadingBlock : p.freeMessage ? freeBlock : paidBlock;

  return <div className={cn("w-full", p.className)}>{body}</div>;
}

export function CancelRefundVerdictAlert(p: { verdict: CancelRefundVerdict }) {
  return (
    <Alert
      className={cn(
        "border-0 shadow-none",
        p.verdict.tone === "ok"
          ? "bg-emerald-50/90 text-emerald-950 [&>svg]:text-emerald-600"
          : "bg-amber-50/90 text-amber-950 [&>svg]:text-amber-700",
      )}
    >
      {p.verdict.tone === "ok" ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
      )}
      <AlertTitle>{p.verdict.title}</AlertTitle>
      {p.verdict.detail ? <AlertDescription>{p.verdict.detail}</AlertDescription> : null}
    </Alert>
  );
}
