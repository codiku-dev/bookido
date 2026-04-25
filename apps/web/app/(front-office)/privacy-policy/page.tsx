"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { FrontOfficePageLayout } from "../_components/FrontOfficePageLayout";

export default function PrivacyPolicyPage() {
  const t = useTranslations("legal.privacy");

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
  const collectSection = (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold text-slate-900">{t("collect.title")}</h2>
      <p className="text-slate-700">{t("collect.body")}</p>
    </section>
  );
  const usageSection = (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold text-slate-900">{t("usage.title")}</h2>
      <p className="text-slate-700">{t("usage.body")}</p>
    </section>
  );
  const retentionSection = (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold text-slate-900">{t("retention.title")}</h2>
      <p className="text-slate-700">{t("retention.body")}</p>
    </section>
  );
  const rightsSection = (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold text-slate-900">{t("rights.title")}</h2>
      <p className="text-slate-700">{t("rights.body")}</p>
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
      {collectSection}
      {usageSection}
      {retentionSection}
      {rightsSection}
      {contactSection}
    </article>
  );

  return (
    <FrontOfficePageLayout topAction={backLink}>
      {bodyBlock}
    </FrontOfficePageLayout>
  );
}
