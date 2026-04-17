'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '@repo/ui/components/badge';
import { StyledTerminal } from '@web/app/examples/components/StyledTerminal';

export function InternationalizationStep() {
  const t = useTranslations('Landing.step5');

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <StyledTerminal
        title="apps/web/.../my-component.tsx"
        titleTitle="apps/web/app/components/my-component.tsx"
        badge={<Badge >{t('code')}</Badge>}
      >
        <span className="text-gray-500">'use client'</span>
        <span className="text-gray-300">;</span>
        {'\n'}
        <span className="text-gray-500">import</span>{' '}
        <span className="text-blue-400">
          {'{'} useTranslations {'}'}
        </span>{' '}
        <span className="text-gray-500">from</span>{' '}
        <span className="text-green-400">'next-intl'</span>
        <span className="text-gray-300">;</span>
        {'\n\n'}
        <span className="text-purple-400">export function</span>{' '}
        <span className="text-yellow-400">MyComponent</span>
        <span className="text-gray-300">() {'{'}</span>
        {'\n'}
        <span className="text-gray-300"> </span>
        <span className="text-purple-400">const</span>{' '}
        <span className="text-blue-400">t</span>{' '}
        <span className="text-purple-400">=</span>{' '}
        <span className="text-yellow-400">useTranslations</span>
        <span className="text-gray-300">(</span>
        <span className="text-green-400">'I18nExample'</span>
        <span className="text-gray-300">);</span>
        {'\n\n'}
        <span className="text-purple-400"> return</span>{' '}
        <span className="text-gray-300">(</span>
        {'\n'}
        <span className="text-gray-300"> {'<'}</span>
        <span className="text-pink-400">div</span>
        <span className="text-gray-300">{'>'}</span>
        {'\n'}
        <span className="text-gray-300"> {'<'}</span>
        <span className="text-pink-400">h1</span>
        <span className="text-gray-300">{'>'}</span>
        <span className="text-gray-300">{'{'}t(</span>
        <span className="text-green-400">'title'</span>
        <span className="text-gray-300">){'}'}</span>
        <span className="text-gray-300">{'</'}</span>
        <span className="text-pink-400">h1</span>
        <span className="text-gray-300">{'>'}</span>
        {'\n'}
        <span className="text-gray-300"> {'</'}</span>
        <span className="text-pink-400">div</span>
        <span className="text-gray-300">{'>'}</span>
        {'\n'}
        <span className="text-gray-300"> );</span>
        {'\n'}
        <span className="text-gray-300">{'}'}</span>
      </StyledTerminal>

      <StyledTerminal
        title={t('result')}
        variant="custom"
        contentClassName="p-6 bg-white h-full"
      >
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
      </StyledTerminal>
    </div>
  );
}

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const dropdownStyle = ((): {
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  } | null => {
    if (!isOpen || typeof document === 'undefined') return null;
    const trigger = triggerRef.current;
    if (!trigger) return null;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 88;
    const openAbove = spaceBelow < dropdownHeight && rect.top > spaceBelow;
    return {
      left: rect.left,
      width: rect.width,
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + 8 }
        : { top: rect.bottom + 8 }),
    };
  })();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLocale = (newLocale: string) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }
    document.cookie = `locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setIsOpen(false);
    startTransition(() => {
      router.refresh();
    });
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
  ];

  const dropdownContent = isOpen && dropdownStyle && (
    <div
      ref={dropdownRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
      style={{
        left: dropdownStyle.left,
        width: dropdownStyle.width,
        ...('top' in dropdownStyle
          ? { top: dropdownStyle.top }
          : { bottom: dropdownStyle.bottom }),
      }}
    >
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => changeLocale(lang.code)}
          className={`w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${locale === lang.code ? 'bg-violet-100 text-violet-700 font-semibold' : ''}`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 rounded-lg text-sm font-medium text-zinc-900 transition-colors"
        >
          <span>
            {languages.find((l) => l.code === locale)?.label || locale}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
      {typeof document !== 'undefined' &&
        createPortal(dropdownContent, document.body)}
    </>
  );
}
