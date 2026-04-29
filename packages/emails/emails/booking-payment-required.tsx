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

export type BookingPaymentRequiredProps = {
  locale: EmailLocale;
  brandLogoSrc?: string;
  clientName: string;
  serviceName: string;
  payNowUrl: string;
};

export default function BookingPaymentRequired(p: BookingPaymentRequiredProps): ReactElement {
  const previewText = t({
    locale: p.locale,
    key: "booking.paymentRequired.preview",
  });

  const footerNote = (
    <Text className="m-0 text-[11px] leading-[18px] text-slate-500">
      {t({
        locale: p.locale,
        key: "booking.paymentRequired.footer",
      })}
    </Text>
  );

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="font-sans">
          <EmailBrandShell footer={footerNote} locale={p.locale} brandLogoSrc={p.brandLogoSrc}>
            <Heading as="h1" className="m-0 mb-3 text-2xl font-semibold tracking-tight text-slate-900">
              {t({ locale: p.locale, key: "booking.paymentRequired.heading" })}
            </Heading>
            <Text className="m-0 mb-4 text-[15px] leading-6 text-slate-600">
              {t({
                locale: p.locale,
                key: "booking.paymentRequired.greeting",
                values: { name: p.clientName },
              })}
              <br />
              <br />
              {t({
                locale: p.locale,
                key: "booking.paymentRequired.intro",
                values: { service: p.serviceName },
              })}
            </Text>
            <Section className="mb-6">
              <Button
                href={p.payNowUrl}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white no-underline"
              >
                {t({ locale: p.locale, key: "booking.paymentRequired.cta" })}
              </Button>
            </Section>
            <Text className="m-0 text-sm leading-6 text-slate-600">
              {t({ locale: p.locale, key: "booking.paymentRequired.fallback" })}
            </Text>
            <Text className="m-0 mt-2 break-all text-xs leading-5 text-slate-500">{p.payNowUrl}</Text>
          </EmailBrandShell>
        </Body>
      </Tailwind>
    </Html>
  );
}
