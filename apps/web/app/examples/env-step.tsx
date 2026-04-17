'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@repo/ui/components/badge';
import { StyledTerminal } from '@web/app/examples/components/StyledTerminal';

export function EnvStep() {
  const t4 = useTranslations('Landing.step4');
  const t10 = useTranslations('Landing.step10');

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
        <div className="flex flex-col min-h-0">
          <h3 className="text-lg font-semibold mb-4 text-zinc-200">
            {t4('stronglyTypeEnv')}
          </h3>
          <StyledTerminal
            title="apps/api/env-type.ts"
            badge={<Badge >{t4('zodSchemaBadge')}</Badge>}
            fill
          >
            <span className="text-purple-400">import</span>
            <span className="text-gray-300">{' { z } '}</span>
            <span className="text-purple-400">from</span>
            <span className="text-yellow-400"> {"'zod'"}</span>
            <span className="text-gray-300">;</span>
            {'\n\n'}
            <span className="text-purple-400">export const</span>
            <span className="text-gray-300"> envSchema = z.</span>
            <span className="text-blue-400">object</span>
            <span className="text-gray-300">(</span>
            {'{'}
            {'\n  '}
            <span className="text-green-400">DATABASE_URL</span>
            <span className="text-gray-300">: z.</span>
            <span className="text-blue-400">string</span>
            <span className="text-gray-300">(),</span>
            {'\n  '}
            <span className="text-green-400">AUTH_SECRET</span>
            <span className="text-gray-300">: z.</span>
            <span className="text-blue-400">string</span>
            <span className="text-gray-300">(),</span>
            {'\n'}
            {'}'}
            <span className="text-gray-300">);</span>
          </StyledTerminal>
        </div>

        <div className="flex flex-col min-h-0">
          <h3 className="text-lg font-semibold mb-4 text-zinc-200">
            {t4('typedEnv')}
          </h3>
          <StyledTerminal
          >
            <span className="text-gray-500">// ✨ {t4('typedVarLabel')}</span>
            {'\n'}
            <span className="text-purple-400">const</span>{' '}
            <span className="text-blue-400">dbUrl</span>{' '}
            <span className="text-purple-400">=</span>{' '}
            <span className="text-blue-400">process</span>
            <span className="text-gray-300">.</span>
            <span className="text-blue-400">env</span>
            <span className="text-gray-300">.</span>
            <span className="text-yellow-400 underline decoration-red-500 decoration-wavy decoration-2">
              PATABASE_URL
            </span>
            <span className="text-gray-300">;</span>
          </StyledTerminal>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-zinc-200">
          {t4('validationTitle')}
        </h3>
        <div className="grid gap-8 lg:grid-cols-2">
          <StyledTerminal
            title=".env"
            badge={<Badge >{t4('envFile')}</Badge>}
            size="sm"
            contentPadding="compact"
          >
            <span className="text-green-400">PATABASE_URL</span>
            <span className="text-gray-500">=</span>
            <span className="text-yellow-400">postgresql://...</span>
            {'\n'}
            <span className="text-green-400">PORT</span>
            <span className="text-gray-500">=</span>
            <span className="text-yellow-400">3090</span>
            {'\n'}
            <span className="text-green-400 border-2 p-1 border-green-400">
              {' '}
              {'// AUTH_SECRET is missing'}
            </span>
          </StyledTerminal>

          <StyledTerminal
            title={t4('terminal')}
            size="sm"
            contentPadding="compact"
          >
            <span className="text-red-400">
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            </span>
            {'\n'}
            <span className="text-white">
              🔍 Validating environment variables
            </span>
            {'\n'}
            <span className="text-red-400">
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            </span>
            {'\n\n'}
            <span className="text-red-400">
              {' '}
              ❌ apps/api: Missing env variable : AUTH_SECRET
            </span>
          </StyledTerminal>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-200">
          {t4('encryptedEnvTitle')}
        </h3>
        <p className="text-zinc-300 text-sm leading-relaxed">{t10('intro')}</p>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
          <div className="flex flex-col min-h-0">
            <StyledTerminal
              title=".env.production"
              badge={<Badge >{t10('encryptedBadge')}</Badge>}
              fill
              contentPadding="compact"
            >
              <span className="text-gray-500">
                # dotenvx – {t10('encryptedComment')}
              </span>
              {'\n'}
              <span className="text-green-400">DATABASE_URL</span>
              <span className="text-gray-300">=</span>
              <span className="text-amber-400">
                encrypted:BK6Rja5JUUxXIIUcPtx...
              </span>
              {'\n'}
              <span className="text-green-400">BETTER_AUTH_SECRET</span>
              <span className="text-gray-300">=</span>
              <span className="text-amber-400">
                encrypted:BIEYdZGGtCxxmYXV8LT5r...
              </span>
              {'\n'}
              <span className="text-green-400">FRONTEND_URL</span>
              <span className="text-gray-300">=</span>
              <span className="text-amber-400">
                encrypted:BA0oNkh2YysZRvfIOK1j...
              </span>
            </StyledTerminal>
          </div>

          <div className="flex flex-col min-h-0">
            <StyledTerminal
              title=".env.keys"
              badge={
                <Badge
                  className="border-red-500/40 bg-red-500/20 text-red-200"
                >
                  {t10('privateBadge')}
                </Badge>
              }
              fill
              contentPadding="compact"
            >
              <span className="text-gray-500"># {t10('keysComment')}</span>
              {'\n\n'}
              <span className="text-green-400">
                DOTENV_PRIVATE_KEY_PRODUCTION
              </span>
              <span className="text-gray-300">=</span>
              <span className="text-amber-400">
                47d9eecc1c4243351d1a5f81a5af624ce...
              </span>
            </StyledTerminal>
            <p className="text-zinc-400 text-xs mt-3">{t10('ciHint')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
