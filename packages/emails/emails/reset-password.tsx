import {
  Body,
  Button,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { ReactElement } from "react";

import { EmailBrandShell } from "../components/email-brand-shell";
import { type EmailLocale } from "../i18n/messages";
import { t } from "../i18n/t";

export type ResetPasswordProps = {
  name: string | null;
  url: string;
  locale: EmailLocale;
  brandLogoSrc?: string;
};

export default function ResetPassword(p: ResetPasswordProps): ReactElement {
  const displayName = p.name ?? "there";

  const previewText = t({
    locale: p.locale,
    key: "auth.reset.preview",
  });

  const footerNote = (
    <Text className="m-0 text-[11px] leading-[18px] text-slate-500">
      {t({
        locale: p.locale,
        key: "auth.reset.footer",
      })}
    </Text>
  );

  const mainContent = (
    <>
      <Heading
        as="h1"
        className="m-0 mb-3 text-2xl font-semibold tracking-tight text-slate-900"
      >
        {t({
          locale: p.locale,
          key: "auth.reset.heading",
        })}
      </Heading>
      <Text className="m-0 mb-5 text-[15px] leading-6 text-slate-600">
        {t({
          locale: p.locale,
          key: "auth.reset.body.greeting",
          values: { name: displayName },
        })}
        <br />
        <br />
        {t({
          locale: p.locale,
          key: "auth.reset.body.text",
        })}
      </Text>
      <Section className="mb-5 text-center">
        <Button
          href={p.url}
          className="inline-block rounded-xl bg-[#2563eb] px-7 py-3.5 text-[15px] font-semibold text-white no-underline shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
        >
          {t({
            locale: p.locale,
            key: "auth.reset.cta",
          })}
        </Button>
      </Section>
      <Text className="m-0 text-xs leading-5 text-slate-500">
        {t({
          locale: p.locale,
          key: "auth.reset.copy.label",
        })}
        <br />
        <a href={p.url} className="break-all font-medium text-[#2563eb] no-underline">
          {p.url}
        </a>
      </Text>
    </>
  );

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="font-sans">
          <EmailBrandShell
            footer={footerNote}
            locale={p.locale}
            brandLogoSrc={p.brandLogoSrc}
          >
            {mainContent}
          </EmailBrandShell>
        </Body>
      </Tailwind>
    </Html>
  );
}
