'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { TypeSafetyStep } from './type-safety-step';
import { ShareResourcesStep } from './share-resources-step';
import { StorybookStep } from './storybook-step';
import { EnvStep } from './env-step';
import { InternationalizationStep } from './internationalization-step';
import { ApiProtetionStep } from './api-protection-step';
import { AuthStep } from './authentication/auth-step';
import { AutoDocStep } from './auto-doc-step';
import { LoggingStep } from './logging-step';
import { CleanEmailsStep } from './clean-emails-step';
import { Badge } from '@repo/ui/components/badge';

function BangerStackLogo(p: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={p.className}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="url(#bs-logo-bg)" />
      <path
        d="M6 10h20v2.5H6V10zm0 6h16v2.5H6V16zm0 6h12v2.5H6V22z"
        fill="white"
        fillOpacity="0.95"
      />
      <defs>
        <linearGradient
          id="bs-logo-bg"
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

const CREATE_CMD = 'npx create-bangerstack@latest';

export default function Home() {
  const t = useTranslations('Landing');
  const [activeStep, setActiveStep] = useState<
    1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  >(1);
  const [copied, setCopied] = useState(false);

  const copyCreateCmd = useCallback(() => {
    void navigator.clipboard.writeText(CREATE_CMD).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const hasScrolledDownRef = useRef(false);
  const lastScrollYRef = useRef(0);

  const selectStep = useCallback(
    (step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10) => {
      setActiveStep(step);
      // Pas de scroll au clic : évite la remontée puis redescente quand on change de catégorie
    },
    [],
  );

  // Au premier scroll vers le bas → amener vers le bloc des catégories (seulement après ~60px pour éviter le coup sec)
  const scrollThreshold = 60;
  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      const isScrollingDown = current > lastScrollYRef.current;
      lastScrollYRef.current = current;
      if (!isScrollingDown || hasScrolledDownRef.current) return;
      if (current < scrollThreshold) return;
      hasScrolledDownRef.current = true;
      categoriesRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-dvh bg-[#0a0a0b] text-zinc-100 pb-24 sm:pb-32">
      {/* Hero header */}
      <header className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.25),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(10,10,11,0.6)_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-16 sm:pt-8 sm:pb-20">
          {/* Top row: logo + title */}
          <motion.div
            className="flex items-center gap-3 mb-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <BangerStackLogo className="h-9 w-9 shrink-0 rounded-lg shadow-lg shadow-violet-500/20" />
            <span className="text-xl font-bold tracking-tight text-white">
              BangerStack
            </span>
          </motion.div>
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1.5 text-xs font-medium text-violet-300 mb-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-500" />
            </span>
            {t('header.badge')}
          </motion.div>
          <motion.h1
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl mb-4 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.55,
              delay: 0.14,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {t('header.headline')}
          </motion.h1>
          <motion.p
            className="text-lg text-zinc-400 max-w-xl mb-6 leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {t('header.tagline')}
          </motion.p>
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.26,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span className="relative inline-flex rounded-lg overflow-hidden p-px">
              <span
                className="absolute inset-0 rounded-lg animate-[border-glow_3s_linear_infinite] opacity-90"
                style={{
                  background:
                    'conic-gradient(from 0deg, transparent 0%, rgba(139,92,246,0.9) 20%, rgba(167,139,250,1) 40%, rgba(139,92,246,0.9) 60%, rgba(196,181,253,0.6) 80%, transparent 100%)',
                }}
                aria-hidden
              />
              <button
                type="button"
                onClick={copyCreateCmd}
                className="relative z-10 inline-flex items-center gap-2 rounded-[calc(0.5rem-1px)] border border-transparent bg-zinc-800/90 px-3 py-2 text-sm font-mono text-zinc-300 hover:bg-zinc-700/80 transition-colors focus:outline-none focus:ring-1 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0b]"
                title="Copy command"
              >
                <span className="truncate max-w-[240px] sm:max-w-none">
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
            </span>
          </motion.div>
          <motion.div
            className="flex flex-wrap items-center gap-2 text-sm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {t('header.stack')
              .split(' · ')
              .map((tech) => (
                <motion.span
                  key={tech}
                  className="inline-flex rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b]"
                  whileHover={{
                    scale: 1.08,
                    borderColor: 'rgba(139, 92, 246, 0.5)',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    color: 'rgb(196, 181, 253)',
                    boxShadow: '0 0 20px -4px rgba(139, 92, 246, 0.4)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Badge>{tech}</Badge>
                </motion.span>
              ))}
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Features grid – all visible at a glance */}
        <div
          ref={categoriesRef}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10 scroll-mt-6"
        >
          {[
            { num: 1, emoji: '🛡️', label: t('steps.fullstackTypeSafety') },
            { num: 2, emoji: '📦', label: t('steps.shareResources') },
            { num: 3, emoji: '📚', label: t('steps.storybook') },
            { num: 4, emoji: '🔐', label: t('steps.typedEnv') },
            { num: 5, emoji: '🌍', label: t('steps.internationalisation') },
            { num: 6, emoji: '🔒', label: t('steps.apiProtection') },
            { num: 7, emoji: '📄', label: t('steps.autoDoc') },
            { num: 8, emoji: '🔑', label: t('steps.authentication') },
            { num: 9, emoji: '📋', label: t('steps.logging') },
            { num: 10, emoji: '📧', label: t('steps.cleanEmails') },
          ].map((step, index) => {
            const isActive = activeStep === step.num;
            return (
              <motion.button
                key={step.num}
                type="button"
                onClick={() =>
                  selectStep(step.num as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10)
                }
                aria-current={isActive ? 'step' : undefined}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.38 + index * 0.045,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`
                                    flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl text-left min-w-0
                                    transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out
                                    ${
                                      isActive
                                        ? 'bg-violet-500/20 text-white border border-violet-500/40 shadow-[0_0_24px_-4px_rgba(139,92,246,0.3)] ring-2 ring-violet-500/50 ring-offset-2 ring-offset-[#0a0a0b]'
                                        : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200 border border-white/10 hover:scale-[1.02]'
                                    }
                                `}
              >
                <span className="text-xl sm:text-2xl shrink-0" aria-hidden>
                  {step.emoji}
                </span>
                <span className="text-xs sm:text-sm font-medium leading-tight wrap-break-words min-w-0">
                  {step.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Step Content – anchor sur le titre de section, apparition après les catégories */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.82,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div ref={stepContentRef} className="min-h-[100px] scroll-mt-6">
            <AnimatePresence mode="wait">
              {activeStep != null && (
                <motion.div
                  key={`title-${activeStep}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="text-2xl font-bold mb-2 text-white">
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
                  <p className="text-zinc-400">
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="min-h-[400px] rounded-xl border border-white/10 bg-white/5 overflow-hidden p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
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
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
