'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Badge } from '@repo/ui/components/badge';
import { StyledTerminal } from '@web/app/examples/components/StyledTerminal';
import reactEmailExampleImg from './assets/react-email-example.png';
export function CleanEmailsStep() {
  const t = useTranslations('Landing.step11');
  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
        <StyledTerminal
          title="packages/emails/src/YourEmail.tsx"
          badge={<Badge size="sm">{t('reactEmailBadge')}</Badge>}
        >
          <span className="text-purple-400">export default function</span>{' '}
          <span className="text-yellow-400">Email</span>
          <span className="text-gray-300">(</span>
          <span className="text-purple-400">p</span>
          <span className="text-gray-300">: </span>
          <span className="text-blue-400">{'{ locale: string }'}</span>
          <span className="text-gray-300">) {'{'}</span>
          {'\n'}
          <span className="text-purple-400">return</span>{' '}
          <span className="text-gray-300">(</span>
          {'\n'}
          <span className="text-gray-300">{'  '}</span>
          <span className="text-gray-300">{'<'}</span>
          <span className="text-pink-400">Tailwind</span>
          <span className="text-gray-300">{'>'}</span>
          {'\n'}
          <span className="text-gray-300">{'    '}</span>
          <span className="text-gray-300">{'<'}</span>
          <span className="text-pink-400">Body</span>{' '}
          <span className="text-gray-300">className=</span>
          <span className="text-amber-400">{'"bg-slate-100 py-6 font-sans"'}</span>
          <span className="text-gray-300">{'>'}</span>
          {'\n'}
          <span className="text-gray-300">{'      '}</span>
          <span className="text-gray-300">{'<'}</span>
          <span className="text-pink-400">Text</span>
          <span className="text-gray-300">{'>'}</span>
          <span className="text-gray-300">{'{'}</span>
          <span className="text-blue-400">t</span>
          <span className="text-gray-300">
            {`({ locale: p.locale, key: 'auth.signup.heading' })`}
          </span>
          <span className="text-gray-300">{'}'}</span>
          <span className="text-gray-300">{'</'}</span>
          <span className="text-pink-400">Text</span>
          <span className="text-gray-300">{'>'}</span>
          {'\n'}
          <span className="text-gray-300">{'    '}</span>
          <span className="text-gray-300">{'</'}</span>
          <span className="text-pink-400">Body</span>
          <span className="text-gray-300">{'>'}</span>
          {'\n'}
          <span className="text-gray-300">{'  '}</span>
          <span className="text-gray-300">{'</'}</span>
          <span className="text-pink-400">Tailwind</span>
          <span className="text-gray-300">{'>'}</span>
          {'\n'}
          <span className="text-gray-300">)</span>
          <span className="text-gray-300">;</span>
          {'\n'}
          <span className="text-gray-300">{'}'}</span>
        </StyledTerminal>
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-white">
          <Image
            src={reactEmailExampleImg}
            alt={t('screenshotAlt')}
            width={1200}
            height={800}
            className="w-full h-auto"
            priority
          />
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-800 leading-relaxed">
              {t('explanation')}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              {t('tailwindIntlHint')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
