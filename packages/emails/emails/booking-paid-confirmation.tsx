import {
  Img,
  Link,
  Body,
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

type BookingPaidSession = {
  startAtLabel: string;
};

export type BookingPaidConfirmationProps = {
  locale: EmailLocale;
  brandLogoSrc?: string;
  clientName: string;
  coachName: string;
  coachImageUrl?: string | null;
  serviceName: string;
  serviceDurationMinutes: number;
  servicePackSize: number;
  paidAmountLabel: string;
  serviceAddress: string;
  serviceMapsUrl?: string | null;
  sessions: BookingPaidSession[];
};

export default function BookingPaidConfirmation(p: BookingPaidConfirmationProps): ReactElement {
  const safeCoachImageUrl =
    typeof p.coachImageUrl === "string" && /^https?:\/\//i.test(p.coachImageUrl.trim())
      ? p.coachImageUrl.trim()
      : null;

  const previewText = t({
    locale: p.locale,
    key: "booking.paid.preview",
  });

  const footerNote = (
    <Text className="m-0 text-[11px] leading-[18px] text-slate-500">
      {t({
        locale: p.locale,
        key: "booking.paid.footer",
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
              {t({ locale: p.locale, key: "booking.paid.heading" })}
            </Heading>
            <Text className="m-0 mb-4 text-[15px] leading-6 text-slate-600">
              {t({
                locale: p.locale,
                key: "booking.paid.greeting",
                values: { name: p.clientName },
              })}
              <br />
              <br />
              {t({ locale: p.locale, key: "booking.paid.intro" })}
            </Text>

            <Section className="mb-5 rounded-xl border border-solid border-slate-200 bg-white px-4 py-4">
              <Text className="m-0 mb-2 text-sm font-semibold text-slate-900">
                {t({ locale: p.locale, key: "booking.paid.proHeading" })}
              </Text>
              <Section className="rounded-xl border border-solid border-slate-200 bg-slate-50 px-3 py-3">
                {safeCoachImageUrl ? (
                  <Img
                    src={safeCoachImageUrl}
                    alt={p.coachName}
                    width={64}
                    height={64}
                    className="mb-2 rounded-full object-cover"
                  />
                ) : null}
                <Text className="m-0 text-sm leading-6 text-slate-700">
                  <strong>{t({ locale: p.locale, key: "booking.paid.coachLabel" })}:</strong> {p.coachName}
                </Text>
              </Section>
            </Section>

            <Section className="mb-5 rounded-xl border border-solid border-slate-200 bg-white px-4 py-4">
              <Text className="m-0 mb-2 text-sm font-semibold text-slate-900">
                {t({ locale: p.locale, key: "booking.paid.summaryHeading" })}
              </Text>
              <Section className="rounded-xl border border-solid border-slate-200 bg-slate-50 px-3 py-3">
                <Text className="m-0 mb-1.5 text-sm leading-6 text-slate-700">
                  <strong>{t({ locale: p.locale, key: "booking.paid.serviceLabel" })}:</strong> {p.serviceName}
                </Text>
                <Text className="m-0 mb-1.5 text-sm leading-6 text-slate-700">
                  <strong>{t({ locale: p.locale, key: "booking.paid.durationLabel" })}:</strong> {p.serviceDurationMinutes} min
                </Text>
                <Text className="m-0 mb-1.5 text-sm leading-6 text-slate-700">
                  <strong>{t({ locale: p.locale, key: "booking.paid.sessionsLabel" })}:</strong> {p.servicePackSize}
                </Text>
                <Text className="m-0 text-sm leading-6 text-slate-700">
                  <strong>{t({ locale: p.locale, key: "booking.paid.amountLabel" })}:</strong> {p.paidAmountLabel}
                </Text>
              </Section>
            </Section>

            <Section className="mb-5 rounded-xl border border-solid border-slate-200 bg-white px-4 py-4">
              <Text className="m-0 mb-2 text-sm font-semibold text-slate-900">
                {t({ locale: p.locale, key: "booking.paid.whereHeading" })}
              </Text>
              <Section className="rounded-xl border border-solid border-slate-200 bg-slate-50 px-3 py-3">
                <Text className="m-0 mb-2 text-sm leading-6 text-slate-700">
                  <strong>{t({ locale: p.locale, key: "booking.paid.addressLabel" })}:</strong> {p.serviceAddress}
                </Text>
                {p.serviceMapsUrl ? (
                  <Link href={p.serviceMapsUrl} className="text-sm font-medium text-blue-600 underline">
                    {t({ locale: p.locale, key: "booking.paid.openMapLink" })}
                  </Link>
                ) : null}
              </Section>
            </Section>

            <Text className="m-0 mb-2 text-sm font-semibold text-slate-900">
              {t({ locale: p.locale, key: "booking.paid.whenHeading" })}
            </Text>
            {p.sessions.length === 0 ? (
              <Text className="m-0 text-sm leading-6 text-slate-600">
                {t({ locale: p.locale, key: "booking.paid.scheduleFallback" })}
              </Text>
            ) : (
              <Section className="mb-2 rounded-xl border border-solid border-slate-200 bg-white px-4 py-3">
                {p.sessions.map((session, idx) => (
                  <Section key={`${session.startAtLabel}-${idx}`} className="mb-2 rounded-lg border border-solid border-slate-200 bg-slate-50 px-3 py-2">
                    <Text className="m-0 text-sm font-semibold text-slate-900">
                      {t({ locale: p.locale, key: "booking.paid.sessionItemLabel", values: { number: String(idx + 1) } })}
                    </Text>
                    <Text className="m-0 text-sm leading-6 text-slate-700">{session.startAtLabel}</Text>
                  </Section>
                ))}
              </Section>
            )}
          </EmailBrandShell>
        </Body>
      </Tailwind>
    </Html>
  );
}
