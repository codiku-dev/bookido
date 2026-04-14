import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import type { ReactElement } from 'react';
import { t } from '../i18n/t';
import { type EmailLocale } from '../i18n/messages';

export type ConfirmSignupProps = {
  name: string | null;
  url: string;
  locale: EmailLocale;
};

export default function ConfirmSignup(p: ConfirmSignupProps): ReactElement {
  const displayName = p.name ?? 'there';

  return (
    <Html>
      <Head />
      <Preview>
        {t({
          locale: p.locale,
          key: 'auth.signup.preview',
        })}
      </Preview>
      <Tailwind>
        <Body className="bg-slate-100 py-6 font-sans">
          <Container className="mx-auto max-w-[480px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.15),0_0_0_1px_rgba(15,23,42,0.04)]">
            <Section className="px-7 pb-2 pt-7">
            <Heading
              as="h1"
              className="m-0 mb-2 text-[22px] tracking-[-0.03em] text-slate-950"
            >
              {t({
                locale: p.locale,
                key: 'auth.signup.heading',
              })}
            </Heading>
            <Text className="m-0 mb-[18px] text-sm leading-[22px] text-slate-600">
              {t({
                locale: p.locale,
                key: 'auth.signup.body.greeting',
                values: { name: displayName },
              })}
              <br />
              <br />
              {t({
                locale: p.locale,
                key: 'auth.signup.body.text',
              })}
            </Text>
            <Section className="mb-[18px] text-center">
              <Button
                href={p.url}
                className="inline-block rounded-full bg-slate-900 px-[26px] py-3 text-sm font-semibold tracking-[0.03em] text-slate-50 no-underline"
              >
                {t({
                  locale: p.locale,
                  key: 'auth.signup.cta',
                })}
              </Button>
            </Section>
            <Text className="m-0 text-xs leading-5 text-slate-500">
              {t({
                locale: p.locale,
                key: 'auth.signup.copy.label',
              })}
              <br />
              <a
                href={p.url}
                className="break-all text-slate-900"
              >
                {p.url}
              </a>
            </Text>
          </Section>

            <Hr className="mt-4 border-slate-200" />

            <Section className="px-7 pb-5 pt-[14px]">
              <Text className="m-0 text-[11px] leading-[18px] text-slate-400">
              {t({
                locale: p.locale,
                key: 'auth.signup.footer',
              })}
            </Text>
          </Section>
        </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
