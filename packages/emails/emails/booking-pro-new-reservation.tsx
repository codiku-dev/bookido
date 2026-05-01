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

export type BookingProNewReservationProps = {
  locale: EmailLocale;
  brandLogoSrc?: string;
  coachName: string;
  clientName: string;
  serviceName: string;
  statusLabel: string;
  adminBookingsUrl: string;
  sessions: { whenLabel: string }[];
};

export default function BookingProNewReservation(p: BookingProNewReservationProps): ReactElement {
  const previewText = t({ locale: p.locale, key: "booking.proNew.preview" });
  const footerNote = (
    <Text className="m-0 text-[11px] leading-[18px] text-slate-500">
      {t({ locale: p.locale, key: "booking.proNew.footer" })}
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
              {t({ locale: p.locale, key: "booking.proNew.heading" })}
            </Heading>
            <Text className="m-0 mb-1 text-[15px] leading-6 text-slate-600">
              {t({
                locale: p.locale,
                key: "booking.proNew.intro",
                values: {
                  client: p.clientName,
                  service: p.serviceName,
                  status: p.statusLabel,
                },
              })}
            </Text>
            <Text className="m-0 mb-4 text-sm text-slate-500">{p.coachName}</Text>
            <Text className="m-0 mb-2 text-sm font-semibold text-slate-800">
              {t({ locale: p.locale, key: "booking.proNew.sessionsHeading" })}
            </Text>
            <Section className="mb-6 space-y-1">
              {p.sessions.map((session, index) => (
                <Text key={String(index)} className="m-0 text-sm text-slate-700">
                  {t({
                    locale: p.locale,
                    key: "booking.proNew.sessionLine",
                    values: { number: String(index + 1), when: session.whenLabel },
                  })}
                </Text>
              ))}
            </Section>
            <Section className="mb-4">
              <Button
                href={p.adminBookingsUrl}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white no-underline"
              >
                {t({ locale: p.locale, key: "booking.proNew.cta" })}
              </Button>
            </Section>
            <Text className="m-0 break-all text-xs leading-5 text-slate-500">{p.adminBookingsUrl}</Text>
          </EmailBrandShell>
        </Body>
      </Tailwind>
    </Html>
  );
}
