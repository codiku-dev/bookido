"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import BookidoLogo from "#/components/BookidoLogo";

type FrontOfficePageLayoutProps = {
  children: ReactNode;
  topAction?: ReactNode;
  rootClassName?: string;
  contentClassName?: string;
};

export function FrontOfficePageLayout(p: FrontOfficePageLayoutProps) {
  const t = useTranslations();

  const brandHeader = (
    <div className="absolute top-6 left-6 z-30 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
        <BookidoLogo className="w-6 h-6 brightness-0 invert" />
      </div>
      <div>
        <div className="text-lg font-bold text-slate-900">Bookido</div>
        <div className="text-sm text-slate-600">{t("public.brand.subtitle")}</div>
      </div>
    </div>
  );

  return (
    <section className={p.rootClassName ?? "min-h-screen bg-white py-12 px-6"}>
      {brandHeader}
      <div className={p.contentClassName ?? "max-w-5xl mx-auto pt-20"}>
        <div className="min-h-12 mb-6">{p.topAction}</div>
        {p.children}
      </div>
    </section>
  );
}
