'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check } from 'lucide-react';
import { Badge } from '@repo/ui/components/badge';
import { TypeSafetyStep } from '@/app/examples/type-safety-step';
import { ShareResourcesStep } from '@/app/examples/share-resources-step';
import { StorybookStep } from '@/app/examples/storybook-step';
import { EnvStep } from '@/app/examples/env-step';
import { InternationalizationStep } from '@/app/examples/internationalization-step';
import { ApiProtetionStep } from '@/app/examples/api-protection-step';
import { AuthStep } from '@/app/examples/authentication/auth-step';
import { AutoDocStep } from '@/app/examples/auto-doc-step';
import { LoggingStep } from '@/app/examples/logging-step';
import { CleanEmailsStep } from '@/app/examples/clean-emails-step';
import { Clipboard } from '@capacitor/clipboard';
import { SafeArea } from '@/ui/safe-area';

const CREATE_CMD = 'npx create-bangerstack@latest';

const MOBILE_PKG_VERSION =
  process.env["NEXT_PUBLIC_MOBILE_PACKAGE_VERSION"] ?? "—";
const PLAY_VERSION_NAME =
  process.env["NEXT_PUBLIC_PLAY_STORE_VERSION_NAME"] ?? "—";
const PLAY_VERSION_CODE =
  process.env["NEXT_PUBLIC_PLAY_STORE_VERSION_CODE"] ?? "—";

function BangerStackLogo(p: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={p.className}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="url(#bs-logo-bg-mobile)" />
      <path
        d="M6 10h20v2.5H6V10zm0 6h16v2.5H6V16zm0 6h12v2.5H6V22z"
        fill="white"
        fillOpacity="0.95"
      />
      <defs>
        <linearGradient
          id="bs-logo-bg-mobile"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#7c3aed" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Landing() {
  const t = useTranslations('Landing');
  const [activeStep, setActiveStep] = useState<
    1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  >(1);
  const [copied, setCopied] = useState(false);

  const copyCreateCmd = useCallback(async () => {
    Clipboard.write({
      string: CREATE_CMD,
    }).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const selectStep = useCallback(
    (step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10) => {
      setActiveStep(step);
    },
    [],
  );

  const steps = [
    { num: 1 as const, emoji: '🛡️', labelKey: 'fullstackTypeSafety' as const },
    { num: 2 as const, emoji: '📦', labelKey: 'shareResources' as const },
    { num: 3 as const, emoji: '📚', labelKey: 'storybook' as const },
    { num: 4 as const, emoji: '🔐', labelKey: 'typedEnv' as const },
    { num: 5 as const, emoji: '🌍', labelKey: 'internationalisation' as const },
    { num: 6 as const, emoji: '🔒', labelKey: 'apiProtection' as const },
    { num: 7 as const, emoji: '📄', labelKey: 'autoDoc' as const },
    { num: 8 as const, emoji: '🔑', labelKey: 'authentication' as const },
    { num: 9 as const, emoji: '📋', labelKey: 'logging' as const },
    { num: 10 as const, emoji: '📧', labelKey: 'cleanEmails' as const },
  ];
  //
  return (
    <SafeArea className="min-h-dvh bg-[#0a0a0b] text-zinc-100 pb-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_20%,rgba(99,102,241,0.25),transparent)] h-44" />
      <header className="relative overflow-hidden border-b border-white/10">
        <div className="relative max-w-5xl mx-auto px-4 pt-6 pb-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <BangerStackLogo className="h-9 w-9 shrink-0 rounded-lg shadow-lg shadow-violet-500/20" />
              <span className="text-xl font-bold tracking-tight text-white">
                BangerStack
              </span>
              <span className="text-xs font-medium text-violet-300/90 border border-violet-500/30 rounded-full px-2 py-0.5">
                Mobile
              </span>
            </div>
            <div
              className="text-xs text-zinc-400 text-left sm:text-right space-y-1 shrink-0 font-mono tabular-nums"
              aria-label={`${t('versions.playStore')}: ${PLAY_VERSION_NAME}, ${t('versions.packageJson')}: ${MOBILE_PKG_VERSION}`}
            >
              <div>
                <span className="text-zinc-500">{t('versions.playStore')}</span>
                <span className="mx-1.5 text-zinc-600">·</span>
                <span className="text-zinc-200">
                  {t('versions.playDetail', {
                    name: PLAY_VERSION_NAME,
                    code: PLAY_VERSION_CODE,
                  })}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">{t('versions.packageJson')}</span>
                <span className="mx-1.5 text-zinc-600">·</span>
                <span className="text-zinc-200">{MOBILE_PKG_VERSION}</span>
              </div>
            </div>
          </div>
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 mb-6">
            {t('header.badge')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3 max-w-2xl">
            {t('header.headline')}
          </h1>
          <p className="text-base text-zinc-400 max-w-xl mb-6 leading-relaxed">
            {t('header.tagline')}
          </p>
          <button
            type="button"
            onClick={copyCreateCmd}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/90 px-3 py-2 text-sm font-mono text-zinc-300 hover:bg-zinc-700/80"
          >
            <span className="truncate max-w-[min(100%,280px)]">
              {CREATE_CMD}
            </span>
            {copied ? (
              <Check
                className="h-4 w-4 shrink-0 text-emerald-400"
                aria-hidden
              />
            ) : (
              <Copy className="h-4 w-4 shrink-0" aria-hidden />
            )}
          </button>
          <div className="flex flex-wrap gap-2 mt-6 text-sm">
            {t('header.stack')
              .split(' · ')
              .map((tech) => (
                <Badge key={tech}>{tech}</Badge>
              ))}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-8">
          {steps.map((step) => {
            const isActive = activeStep === step.num;
            return (
              <button
                key={step.num}
                type="button"
                onClick={() => selectStep(step.num)}
                aria-current={isActive ? 'step' : undefined}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl text-left min-w-0 transition-colors ${
                  isActive
                    ? 'bg-violet-500/20 text-white border border-violet-500/40'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span className="text-lg shrink-0" aria-hidden>
                  {step.emoji}
                </span>
                <span className="text-xs sm:text-sm font-medium leading-tight min-w-0">
                  {t(`steps.${step.labelKey}`)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-1 text-white">
              {activeStep === 1 && `🛡️ ${t('step1.title')}`}
              {activeStep === 2 && `📦 ${t('step2.title')}`}
              {activeStep === 3 && `📚 ${t('step3.title')}`}
              {activeStep === 4 && `🔐 ${t('step4.title')}`}
              {activeStep === 5 && `🌍 ${t('step5.title')}`}
              {activeStep === 6 && `🔒 ${t('step6.title')}`}
              {activeStep === 7 && `📄 ${t('step7.title')}`}
              {activeStep === 8 && `🔑 ${t('step8.title')}`}
              {activeStep === 9 && `📋 ${t('step9.title')}`}
              {activeStep === 10 && `📧 ${t('step11.title')}`}
            </h2>
            <p className="text-sm text-zinc-400">
              {activeStep === 1 && t('descriptions.fullstackTypeSafety')}
              {activeStep === 2 && t('descriptions.shareResources')}
              {activeStep === 3 && t('descriptions.storybook')}
              {activeStep === 4 && t('descriptions.typedEnv')}
              {activeStep === 5 && t('descriptions.internationalisation')}
              {activeStep === 6 && t('descriptions.apiProtection')}
              {activeStep === 7 && t('descriptions.autoDoc')}
              {activeStep === 8 && t('descriptions.authentication')}
              {activeStep === 9 && t('descriptions.logging')}
              {activeStep === 10 && t('descriptions.cleanEmails')}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6">
            {activeStep === 1 && <TypeSafetyStep />}
            {activeStep === 2 && <ShareResourcesStep />}
            {activeStep === 3 && <StorybookStep />}
            {activeStep === 4 && <EnvStep />}
            {activeStep === 5 && <InternationalizationStep />}
            {activeStep === 6 && <ApiProtetionStep />}
            {activeStep === 7 && <AutoDocStep />}
            {activeStep === 8 && <AuthStep />}
            {activeStep === 9 && <LoggingStep />}
            {activeStep === 10 && <CleanEmailsStep />}
          </div>
        </div>
      </div>
    </SafeArea>
  );
}
