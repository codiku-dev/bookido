import {
  Body,
  Button,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { ReactElement, ReactNode } from "react";

import { EmailBrandShell } from "../components/email-brand-shell";
import { type EmailLocale } from "../i18n/messages";
import { t } from "../i18n/t";

export type BookingPaidSession = {
  startAtLabel: string;
  startsAtIso: string;
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

  const innerMuted = (children: ReactNode) => (
    <Section className="rounded-xl border border-solid border-slate-200 bg-slate-50 px-4 py-4">{children}</Section>
  );

  const coachInitial = p.coachName.trim().length > 0 ? p.coachName.trim().slice(0, 1).toUpperCase() : "?";

  const coachAvatar = safeCoachImageUrl ? (
    <Img
      src={safeCoachImageUrl}
      alt=""
      width={88}
      height={88}
      className="rounded-full object-cover"
      style={{ display: "block", border: "2px solid #e2e8f0" }}
    />
  ) : (
    <table cellPadding={0} cellSpacing={0} border={0} role="presentation">
      <tbody>
        <tr>
          <td
            style={{
              width: 88,
              height: 88,
              borderRadius: 9999,
              backgroundColor: "#e2e8f0",
              border: "2px solid #cbd5e1",
              textAlign: "center",
              verticalAlign: "middle",
            }}
          >
            <Text className="m-0 text-[32px] font-bold leading-none text-slate-600">{coachInitial}</Text>
          </td>
        </tr>
      </tbody>
    </table>
  );

  const proBlock = (
    <Section className="mb-5 overflow-hidden rounded-2xl border border-solid border-slate-200 bg-white">
      <Section className="bg-slate-50 px-5 py-5">
        <table cellPadding={0} cellSpacing={0} border={0} role="presentation" width="100%">
          <tbody>
            <tr>
              <td style={{ width: 100, verticalAlign: "middle", paddingRight: 16 }}>{coachAvatar}</td>
              <td style={{ verticalAlign: "middle" }}>
                <Text className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t({ locale: p.locale, key: "booking.paid.proHeading" })}
                </Text>
                <Text className="m-0 mt-1 text-xl font-bold leading-tight text-slate-900">{p.coachName}</Text>
                <Text className="m-0 mt-2 text-sm leading-5 text-slate-600">{p.serviceName}</Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>
    </Section>
  );

  const addressDisplay = (p.serviceAddress ?? "").trim();

  const receiptRows = (
    <Section className="m-0 p-0">
      <table cellPadding={0} cellSpacing={0} border={0} role="presentation" width="100%">
        <tbody>
          <tr>
            <td className="py-2 pr-2 text-sm text-slate-600">{t({ locale: p.locale, key: "booking.paid.serviceLabel" })}</td>
            <td className="py-2 text-right text-sm font-medium text-slate-900">{p.serviceName}</td>
          </tr>
          <tr>
            <td className="py-2 pr-2 text-sm text-slate-600">{t({ locale: p.locale, key: "booking.paid.durationLabel" })}</td>
            <td className="py-2 text-right text-sm font-medium text-slate-900">{p.serviceDurationMinutes} min</td>
          </tr>
          <tr>
            <td className="py-2 pr-2 text-sm text-slate-600">{t({ locale: p.locale, key: "booking.paid.sessionsLabel" })}</td>
            <td className="py-2 text-right text-sm font-medium text-slate-900">{p.servicePackSize}</td>
          </tr>
        </tbody>
      </table>
      <Hr className="my-3 border-0 border-t border-solid border-slate-200" />
      <table cellPadding={0} cellSpacing={0} border={0} role="presentation" width="100%">
        <tbody>
          <tr>
            <td className="pt-1 text-base font-bold text-slate-900">{t({ locale: p.locale, key: "booking.paid.amountLabel" })}</td>
            <td className="pt-1 text-right text-lg font-bold text-slate-900">{p.paidAmountLabel}</td>
          </tr>
        </tbody>
      </table>
    </Section>
  );

  const receiptBlock = (
    <Section className="mb-5 rounded-2xl border border-solid border-slate-200 bg-white px-5 py-4">
      <Text className="m-0 mb-3 text-sm font-semibold text-slate-900">
        {t({ locale: p.locale, key: "booking.paid.receiptHeading" })}
      </Text>
      {innerMuted(receiptRows)}
    </Section>
  );

  const sessionCards = p.sessions.map((session, idx) => {
    const isLast = idx === p.sessions.length - 1;
    return (
      <Section
        key={`${session.startsAtIso}-${idx}`}
        className={`overflow-hidden rounded-xl border border-solid border-slate-200 bg-white ${isLast ? "" : "mb-3"}`}
      >
        <Section className="bg-slate-50 px-4 py-3">
          <Text className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t({ locale: p.locale, key: "booking.paid.sessionItemLabel", values: { number: String(idx + 1) } })}
          </Text>
          <Text className="m-0 mt-1 text-[15px] font-semibold leading-snug text-slate-900">{session.startAtLabel}</Text>
        </Section>
      </Section>
    );
  });

  const scheduleBlock =
    p.sessions.length === 0 ? (
      <Text className="m-0 text-sm leading-6 text-slate-600">{t({ locale: p.locale, key: "booking.paid.scheduleFallback" })}</Text>
    ) : (
      <Section className="m-0 p-0">{sessionCards}</Section>
    );

  const whenBlock = (
    <Section className="mb-5 rounded-2xl border border-solid border-slate-200 bg-white px-5 py-4">
      <Text className="m-0 mb-3 text-sm font-semibold text-slate-900">
        {t({ locale: p.locale, key: "booking.paid.scheduleHeading" })}
      </Text>
      {scheduleBlock}
    </Section>
  );

  const mapsUrl =
    typeof p.serviceMapsUrl === "string" && p.serviceMapsUrl.trim().length > 0 ? p.serviceMapsUrl.trim() : null;

  const whereBlock = (
    <Section className="mb-5 rounded-2xl border border-solid border-slate-200 bg-white px-5 py-4">
      <Text className="m-0 mb-3 text-sm font-semibold text-slate-900">
        {t({ locale: p.locale, key: "booking.paid.whereHeading" })}
      </Text>
      {innerMuted(
        <Section className="m-0 p-0">
          <Text className="m-0 mb-3 text-[15px] leading-6 text-slate-800">{addressDisplay}</Text>
          {mapsUrl ? (
            <Button
              href={mapsUrl}
              className="rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white no-underline"
            >
              {t({ locale: p.locale, key: "booking.paid.openMapLink" })}
            </Button>
          ) : null}
        </Section>,
      )}
    </Section>
  );

  const headerBlock = (
    <Section className="m-0 p-0">
      <Heading as="h1" className="m-0 mb-2 text-2xl font-semibold tracking-tight text-slate-900">
        {t({ locale: p.locale, key: "booking.paid.heading" })}
      </Heading>
      <Text className="m-0 mb-1 text-[15px] leading-6 text-slate-700">
        {t({
          locale: p.locale,
          key: "booking.paid.greeting",
          values: { name: p.clientName },
        })}
      </Text>
      <Text className="m-0 mb-6 text-[15px] leading-6 text-slate-600">
        {t({ locale: p.locale, key: "booking.paid.intro" })}
      </Text>
    </Section>
  );

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="font-sans">
          <EmailBrandShell footer={footerNote} locale={p.locale} brandLogoSrc={p.brandLogoSrc}>
            {headerBlock}
            {proBlock}
            {whenBlock}
            {whereBlock}
            {receiptBlock}
          </EmailBrandShell>
        </Body>
      </Tailwind>
    </Html>
  );
}
