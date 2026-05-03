import {
  Body,
  Button,
  Head,
  Heading,
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

export type BookingClientReminderProps = {
  locale: EmailLocale;
  brandLogoSrc?: string;
  clientName: string;
  coachName: string;
  coachReplyToEmail?: string | null;
  coachImageUrl?: string | null;
  serviceName: string;
  sessionStartLabel: string;
  durationMinutes: number;
  serviceAddress: string;
  serviceMapsUrl?: string | null;
};

export default function BookingClientReminder(p: BookingClientReminderProps): ReactElement {
  const safeCoachImageUrl =
    typeof p.coachImageUrl === "string" && /^https?:\/\//i.test(p.coachImageUrl.trim())
      ? p.coachImageUrl.trim()
      : null;

  const previewText = t({ locale: p.locale, key: "booking.reminder.preview" });

  const footerNote = (
    <Text className="m-0 text-[11px] leading-[18px] text-slate-500">
      {t({
        locale: p.locale,
        key: "booking.reminder.footer",
        values: { coachName: p.coachName },
      })}
    </Text>
  );

  const coachInitial = p.coachName.trim().length > 0 ? p.coachName.trim().slice(0, 1).toUpperCase() : "?";

  const coachAvatar = safeCoachImageUrl ? (
    <Img
      src={safeCoachImageUrl}
      alt=""
      width={72}
      height={72}
      className="rounded-full object-cover"
      style={{ display: "block", border: "2px solid #e2e8f0" }}
    />
  ) : (
    <table cellPadding={0} cellSpacing={0} border={0} role="presentation">
      <tbody>
        <tr>
          <td
            style={{
              width: 72,
              height: 72,
              borderRadius: 9999,
              backgroundColor: "#e2e8f0",
              border: "2px solid #cbd5e1",
              textAlign: "center",
              verticalAlign: "middle",
            }}
          >
            <Text className="m-0 text-[26px] font-bold leading-none text-slate-600">{coachInitial}</Text>
          </td>
        </tr>
      </tbody>
    </table>
  );

  const innerMuted = (children: ReactNode) => (
    <Section className="rounded-xl border border-solid border-slate-200 bg-slate-50 px-4 py-4">{children}</Section>
  );

  const proBlock = (
    <Section className="mb-5 overflow-hidden rounded-2xl border border-solid border-slate-200 bg-white">
      <Section className="bg-slate-50 px-5 py-4">
        <table cellPadding={0} cellSpacing={0} border={0} role="presentation" width="100%">
          <tbody>
            <tr>
              <td style={{ width: 88, verticalAlign: "middle", paddingRight: 14 }}>{coachAvatar}</td>
              <td style={{ verticalAlign: "middle" }}>
                <Text className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t({ locale: p.locale, key: "booking.reminder.proHeading" })}
                </Text>
                <Text className="m-0 mt-1 text-lg font-bold leading-tight text-slate-900">{p.coachName}</Text>
                <Text className="m-0 mt-1 text-sm leading-5 text-slate-600">{p.serviceName}</Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>
    </Section>
  );

  const addressDisplay = (p.serviceAddress ?? "").trim();
  const mapsUrl =
    typeof p.serviceMapsUrl === "string" && p.serviceMapsUrl.trim().length > 0 ? p.serviceMapsUrl.trim() : null;

  const whenBlock = (
    <Section className="mb-5 rounded-2xl border border-solid border-slate-200 bg-white px-5 py-4">
      <Text className="m-0 mb-2 text-sm font-semibold text-slate-900">
        {t({ locale: p.locale, key: "booking.reminder.whenHeading" })}
      </Text>
      {innerMuted(
        <Section className="m-0 p-0">
          <Text className="m-0 text-[15px] font-semibold leading-6 text-slate-900">{p.sessionStartLabel}</Text>
          <Text className="m-0 mt-2 text-sm text-slate-600">
            {t({
              locale: p.locale,
              key: "booking.reminder.durationLabel",
              values: { minutes: String(p.durationMinutes) },
            })}
          </Text>
        </Section>,
      )}
    </Section>
  );

  const whereBlock =
    addressDisplay.length > 0 ? (
      <Section className="mb-5 rounded-2xl border border-solid border-slate-200 bg-white px-5 py-4">
        <Text className="m-0 mb-3 text-sm font-semibold text-slate-900">
          {t({ locale: p.locale, key: "booking.reminder.whereHeading" })}
        </Text>
        {innerMuted(
          <Section className="m-0 p-0">
            <Text className="m-0 mb-3 text-[15px] leading-6 text-slate-800">{addressDisplay}</Text>
            {mapsUrl ? (
              <Button
                href={mapsUrl}
                className="rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white no-underline"
              >
                {t({ locale: p.locale, key: "booking.reminder.openMapLink" })}
              </Button>
            ) : null}
          </Section>,
        )}
      </Section>
    ) : null;

  const headerBlock = (
    <Section className="m-0 p-0">
      <Heading as="h1" className="m-0 mb-2 text-2xl font-semibold tracking-tight text-slate-900">
        {t({ locale: p.locale, key: "booking.reminder.heading" })}
      </Heading>
      <Text className="m-0 mb-1 text-[15px] leading-6 text-slate-700">
        {t({
          locale: p.locale,
          key: "booking.reminder.greeting",
          values: { name: p.clientName },
        })}
      </Text>
      <Text className="m-0 mb-6 text-[15px] leading-6 text-slate-600">
        {t({ locale: p.locale, key: "booking.reminder.intro" })}
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
          </EmailBrandShell>
        </Body>
      </Tailwind>
    </Html>
  );
}
