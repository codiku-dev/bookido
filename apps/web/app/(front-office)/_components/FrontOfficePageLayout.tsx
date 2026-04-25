"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import BookidoLogo from "#/components/BookidoLogo";

type FrontOfficePageLayoutProps = {
  children: ReactNode;
  topAction?: ReactNode;
  rootClassName?: string;
  contentClassName?: string;
  hideBrandOnMobile?: boolean;
};

export function FrontOfficePageLayout(p: FrontOfficePageLayoutProps) {
  const t = useTranslations();
  const brandClassName = p.hideBrandOnMobile
    ? "mx-auto mb-4 hidden w-full max-w-4xl px-1 sm:mb-5 md:block"
    : "mx-auto mb-4 w-full max-w-4xl px-1 sm:mb-5";

  const brandHeader = (
    <div className={brandClassName}>
      <Link href="/" className="inline-flex items-center gap-2.5 rounded-md sm:gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 sm:h-10 sm:w-10">
          <BookidoLogo className="w-6 h-6 brightness-0 invert" />
        </div>
        <div>
          <div className="text-base font-bold text-slate-900 sm:text-lg">Bookido</div>
          <div className="text-xs text-slate-600 sm:text-sm">{t("public.brand.subtitle")}</div>
        </div>
      </Link>
    </div>
  );

  const contentBlock = (
    <div className={p.contentClassName ?? "mx-auto max-w-4xl"}>
      {p.topAction ? <div className="mb-4 min-h-0 sm:mb-5">{p.topAction}</div> : null}
      {p.children}
    </div>
  );

  return (
    <section className={p.rootClassName ?? "min-h-screen bg-white px-4 py-6 sm:px-6 sm:py-8"}>
      {brandHeader}
      {contentBlock}
    </section>
  );
}
