import { Container, Hr, Section, Text } from "@react-email/components";
import type { ReactElement, ReactNode } from "react";

import { type EmailLocale } from "../i18n/messages";
import { t } from "../i18n/t";
import { BookidoLogoMark } from "./bookido-logo-mark";

type EmailBrandShellProps = {
  children: ReactNode;
  footer: ReactNode;
  locale: EmailLocale;
};

export function EmailBrandShell(p: EmailBrandShellProps): ReactElement {
  const brandHeader = (
    <Section
      className="px-8 py-6"
      style={{
        backgroundColor: "#2563eb",
        backgroundImage: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #3b82f6 100%)",
      }}
    >
      <table cellPadding={0} cellSpacing={0} border={0} role="presentation" width="100%">
        <tbody>
          <tr>
            <td style={{ verticalAlign: "middle", width: 88, paddingRight: 4 }}>
              <table
                cellPadding={0}
                cellSpacing={0}
                border={0}
                role="presentation"
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: "#ffffff",
                  border: "1px solid #bfdbfe",
                  borderRadius: 16,
                }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        width: 80,
                        height: 80,
                        textAlign: "center",
                        verticalAlign: "middle",
                        borderRadius: 16,
                      }}
                    >
                      <BookidoLogoMark width={52} height={44} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td style={{ verticalAlign: "middle", paddingLeft: 12 }}>
              <Text
                className="m-0 font-bold leading-none text-white"
                style={{
                  fontSize: 22,
                  letterSpacing: "-0.02em",
                  fontFamily:
                    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                }}
              >
                Bookido
              </Text>
              <Text
                className="m-0 mt-1 text-[13px] leading-snug text-blue-100"
                style={{
                  opacity: 0.95,
                  fontFamily:
                    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                }}
              >
                {t({ locale: p.locale, key: "email.brand.tagline" })}
              </Text>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );

  const mainCard = (
    <Section className="bg-white px-8 pb-2 pt-8">{p.children}</Section>
  );

  const footerBlock = (
    <>
      <Hr className="m-0 border-0 border-t border-solid border-slate-200" />
      <Section className="bg-slate-50 px-8 py-5">{p.footer}</Section>
    </>
  );

  return (
    <Section className="bg-slate-100 py-8">
      <Container
        className="mx-auto max-w-[520px] overflow-hidden rounded-2xl border border-solid border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
        style={{ borderRadius: 16 }}
      >
        {brandHeader}
        {mainCard}
        {footerBlock}
      </Container>
    </Section>
  );
}
