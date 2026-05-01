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

const DEFAULT_ROOT_CLASS =
  "relative min-h-screen overflow-hidden bg-slate-50 px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8";

const STOREFRONT_MESH_BG = (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
    <div className="absolute -top-32 left-1/2 h-[min(520px,100vw)] w-[min(520px,100vw)] -translate-x-1/2 rounded-full bg-blue-400/22 blur-3xl" />
    <div className="absolute top-36 -right-24 h-72 w-72 rounded-full bg-indigo-400/18 blur-3xl" />
    <div className="absolute bottom-12 -left-16 h-64 w-64 rounded-full bg-cyan-400/14 blur-3xl" />
    <div
      className="absolute inset-0 opacity-[0.32]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    />
  </div>
);

export function FrontOfficePageLayout(p: FrontOfficePageLayoutProps) {
  const t = useTranslations();
  const useStorefrontShell = p.rootClassName == null;
  const rootClass = p.rootClassName ?? DEFAULT_ROOT_CLASS;

  const brandClassName = p.hideBrandOnMobile
    ? "mb-4 hidden w-fit max-w-full sm:mb-6 md:block"
    : "mb-4 w-fit max-w-full sm:mb-6";

  const brandHeader = (
    <div className={brandClassName}>
      <Link href="/" className="inline-flex shrink-0 items-center gap-2.5 text-slate-900 sm:gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm sm:h-10 sm:w-10">
          <BookidoLogo className="w-6 h-6 brightness-0 invert" />
        </div>
        <div className="min-w-0">
          <div className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">Bookido</div>
          <div className="text-xs text-slate-600 sm:text-sm">{t("public.brand.subtitle")}</div>
        </div>
      </Link>
    </div>
  );

  const contentBlock = (
    <div className={p.contentClassName ?? "mx-auto max-w-5xl"}>
      {p.topAction ? <div className="mb-4 min-h-0 sm:mb-5">{p.topAction}</div> : null}
      {p.children}
    </div>
  );

  return (
    <section className={rootClass}>
      {useStorefrontShell ? STOREFRONT_MESH_BG : null}
      <div className={useStorefrontShell ? "relative z-10" : undefined}>
        {brandHeader}
        {contentBlock}
      </div>
    </section>
  );
}
