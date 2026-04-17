'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

export function AutoDocStep() {
  const t = useTranslations('Landing.step7');

  return (
    <div className="space-y-6">
      <a
        href={process.env.NEXT_PUBLIC_API_BASE_URL + '/docs'}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
      >
        {t('openDocs')}
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg">
        <Image
          src="/auto-doc.png"
          alt={t('screenshotAlt')}
          width={1200}
          height={800}
          className="w-full h-auto"
          priority={false}
        />
      </div>
    </div>
  );
}
