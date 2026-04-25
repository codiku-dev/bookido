"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { FrontOfficePageLayout } from "../_components/FrontOfficePageLayout";

export default function TermsOfServicePage() {
  const t = useTranslations("legal.terms");

  const backLink = (
    <div>
      <Link href="/" className="text-sm text-blue-700 hover:underline">
        {t("backHome")}
      </Link>
    </div>
  );

  const pageHeader = (
    <header className="mb-6 space-y-2">
      <h1 className="text-3xl font-bold text-slate-900">{t("title")}</h1>
      <p className="text-sm text-slate-500">{t("updatedAt")}</p>
    </header>
  );

  const introParagraph = <p className="text-slate-700">{t("intro")}</p>;
  const serviceSection = (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold text-slate-900">{t("service.title")}</h2>
      <p className="text-slate-700">{t("service.body")}</p>
    </section>
  );
  const accountSection = (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold text-slate-900">{t("account.title")}</h2>
      <p className="text-slate-700">{t("account.body")}</p>
    </section>
  );
  const paymentsSection = (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold text-slate-900">{t("payments.title")}</h2>
      <p className="text-slate-700">{t("payments.body")}</p>
    </section>
  );
  const liabilitySection = (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold text-slate-900">{t("liability.title")}</h2>
      <p className="text-slate-700">{t("liability.body")}</p>
    </section>
  );
  const contactSection = (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold text-slate-900">{t("contact.title")}</h2>
      <p className="text-slate-700">{t("contact.body")}</p>
    </section>
  );

  const bodyBlock = (
    <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      {pageHeader}
      {introParagraph}
      {serviceSection}
      {accountSection}
      {paymentsSection}
      {liabilitySection}
      {contactSection}
    </article>
  );

  return (
    <FrontOfficePageLayout topAction={backLink}>
      {bodyBlock}
    </FrontOfficePageLayout>
  );
}
