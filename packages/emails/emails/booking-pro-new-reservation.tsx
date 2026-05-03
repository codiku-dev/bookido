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
import type { ReactElement, ReactNode } from "react";

import { EmailBrandShell } from "../components/email-brand-shell";
import { type EmailLocale } from "../i18n/messages";
import { t } from "../i18n/t";

export type BookingProNewReservationProps = {
  locale: EmailLocale;
  brandLogoSrc?: string;
  coachName: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceName: string;
  serviceDurationMinutes: number;
  statusLabel: string;
  /** Deep link to this booking in the admin (e.g. `/admin/bookings/{id}`). */
  adminBookingUrl: string;
  sessions: { whenLabel: string }[];
  isFree: boolean;
  isPaid: boolean;
  paidAmountLabel: string | null;
  listPriceLabel: string | null;
  paymentMethodLabel: string | null;
};

export default function BookingProNewReservation(p: BookingProNewReservationProps): ReactElement {
  const previewText = t({ locale: p.locale, key: "booking.proNew.preview" });

  const footerNote = (
    <Text className="m-0 text-[11px] leading-[18px] text-slate-500">
      {t({ locale: p.locale, key: "booking.proNew.footer" })}
    </Text>
  );

  const innerCard = (children: ReactNode) => (
    <Section className="rounded-xl border border-solid border-slate-200 bg-slate-50 px-3 py-3">{children}</Section>
  );

  const greetingBlock = (
    <Section className="m-0 p-0">
      <Text className="m-0 mb-1 text-[15px] leading-6 text-slate-600">
        {t({ locale: p.locale, key: "booking.proNew.greeting", values: { coachName: p.coachName } })}
      </Text>
      <Text className="m-0 mb-5 text-[15px] leading-6 text-slate-600">{t({ locale: p.locale, key: "booking.proNew.lead" })}</Text>
    </Section>
  );

  const clientBlock = (
    <Section className="mb-5 rounded-xl border border-solid border-slate-200 bg-white px-4 py-4">
      <Text className="m-0 mb-2 text-sm font-semibold text-slate-900">
        {t({ locale: p.locale, key: "booking.proNew.clientHeading" })}
      </Text>
      {innerCard(
        <Section className="m-0 p-0">
          <Text className="m-0 mb-1.5 text-sm leading-6 text-slate-700">
            <strong>{p.clientName}</strong>
          </Text>
          <Text className="m-0 mb-1.5 text-sm leading-6 text-slate-700">
            <strong>{t({ locale: p.locale, key: "booking.proNew.clientEmailLabel" })}:</strong> {p.clientEmail}
          </Text>
          {p.clientPhone && p.clientPhone.trim().length > 0 ? (
            <Text className="m-0 text-sm leading-6 text-slate-700">
              <strong>{t({ locale: p.locale, key: "booking.proNew.clientPhoneLabel" })}:</strong> {p.clientPhone}
            </Text>
          ) : null}
        </Section>,
      )}
    </Section>
  );

  const serviceBlock = (
    <Section className="mb-5 rounded-xl border border-solid border-slate-200 bg-white px-4 py-4">
      <Text className="m-0 mb-2 text-sm font-semibold text-slate-900">
        {t({ locale: p.locale, key: "booking.proNew.serviceHeading" })}
      </Text>
      {innerCard(
        <Section className="m-0 p-0">
          <Text className="m-0 mb-1.5 text-sm leading-6 text-slate-700">
            <strong>{p.serviceName}</strong>
          </Text>
          <Text className="m-0 mb-1.5 text-sm leading-6 text-slate-700">
            <strong>{t({ locale: p.locale, key: "booking.proNew.durationLabel" })}:</strong> {p.serviceDurationMinutes} min
          </Text>
          <Text className="m-0 text-sm leading-6 text-slate-700">
            <strong>{t({ locale: p.locale, key: "booking.proNew.statusLabel" })}:</strong> {p.statusLabel}
          </Text>
        </Section>,
      )}
    </Section>
  );

  const scheduleRows = p.sessions.map((session, index) => {
    const isLast = index === p.sessions.length - 1;
    return (
      <Section
        key={String(index)}
        className={`rounded-lg border border-solid border-slate-200 bg-slate-50 px-3 py-2 ${isLast ? "" : "mb-2"}`}
      >
        <Text className="m-0 text-sm font-semibold text-slate-900">
          {t({ locale: p.locale, key: "booking.paid.sessionItemLabel", values: { number: String(index + 1) } })}
        </Text>
        <Text className="m-0 text-sm leading-6 text-slate-700">{session.whenLabel}</Text>
      </Section>
    );
  });

  const scheduleBlock = (
    <Section className="mb-5 rounded-xl border border-solid border-slate-200 bg-white px-4 py-4">
      <Text className="m-0 mb-2 text-sm font-semibold text-slate-900">
        {t({ locale: p.locale, key: "booking.proNew.scheduleHeading" })}
      </Text>
      <Section className="rounded-xl border border-solid border-slate-200 bg-white px-3 py-3">{scheduleRows}</Section>
    </Section>
  );

  const methodTrimmed = (p.paymentMethodLabel ?? "").trim();
  const showMethod = methodTrimmed.length > 0 && methodTrimmed !== "—";

  const paymentInner: ReactNode = p.isFree ? (
    <Text className="m-0 text-sm leading-6 text-slate-700">{t({ locale: p.locale, key: "booking.proNew.paymentFree" })}</Text>
  ) : p.isPaid && p.paidAmountLabel ? (
    <Section className="m-0 p-0">
      <Text className="m-0 mb-1.5 text-sm leading-6 text-slate-700">
        {t({ locale: p.locale, key: "booking.proNew.paymentPaid", values: { amount: p.paidAmountLabel } })}
      </Text>
      {showMethod ? (
        <Text className="m-0 text-sm leading-6 text-slate-700">
          {t({ locale: p.locale, key: "booking.proNew.paymentMethod", values: { method: methodTrimmed } })}
        </Text>
      ) : null}
    </Section>
  ) : p.listPriceLabel ? (
    <Text className="m-0 text-sm leading-6 text-slate-700">
      {t({ locale: p.locale, key: "booking.proNew.paymentPending", values: { price: p.listPriceLabel } })}
    </Text>
  ) : (
    <Text className="m-0 text-sm leading-6 text-slate-700">{t({ locale: p.locale, key: "booking.proNew.paymentFree" })}</Text>
  );

  const paymentBlock = (
    <Section className="mb-5 rounded-xl border border-solid border-slate-200 bg-white px-4 py-4">
      <Text className="m-0 mb-2 text-sm font-semibold text-slate-900">
        {t({ locale: p.locale, key: "booking.proNew.paymentHeading" })}
      </Text>
      {innerCard(paymentInner)}
    </Section>
  );

  const ctaBlock = (
    <Section className="m-0 p-0">
      <Section className="mb-4">
        <Button
          href={p.adminBookingUrl}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white no-underline"
        >
          {t({ locale: p.locale, key: "booking.proNew.cta" })}
        </Button>
      </Section>
      <Text className="m-0 break-all text-xs leading-5 text-slate-500">{p.adminBookingUrl}</Text>
    </Section>
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
            {greetingBlock}
            {clientBlock}
            {serviceBlock}
            {scheduleBlock}
            {paymentBlock}
            {ctaBlock}
          </EmailBrandShell>
        </Body>
      </Tailwind>
    </Html>
  );
}
