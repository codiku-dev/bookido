'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button/button';
import { StyledTerminal } from '@web/app/examples/components/StyledTerminal';

export function ShareResourcesStep() {
  const t = useTranslations('Landing.step2');

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <StyledTerminal
          title="packages/ui/src/button/button.tsx"
          badge={<Badge>{t('uiPackageSide')}</Badge>}
        >
          <span className="text-purple-400">export function</span>{' '}
          <span className="text-yellow-400">Button</span>
          <span className="text-gray-300">() {'{'}</span>
          {'\n'}
          <span className="text-purple-400"> return</span>{' '}
          <span className="text-gray-300">(</span>
          {'\n'}
          <span className="text-gray-300"> {'<'}</span>
          <span className="text-pink-400">button</span>{' '}
          <span className="text-blue-400">className</span>
          <span className="text-gray-300">=</span>
          <span className="text-green-400">"bg-red-500"</span>
          <span className="text-gray-300">{'>'}</span>
          {'\n'}
          <span className="text-gray-300"> Button</span>
          {'\n'}
          <span className="text-gray-300"> {'</'}</span>
          <span className="text-pink-400">button</span>
          <span className="text-gray-300">{'>'}</span>
          {'\n'}
          <span className="text-gray-300"> );</span>
          {'\n'}
          <span className="text-gray-300">{'}'}</span>
        </StyledTerminal>

        <StyledTerminal
          title="apps/web/app/page.tsx"
          badge={<Badge >{t('nextjsSide')}</Badge>}
          size="sm"
          contentPadding="compact"
        >
          <span className="text-gray-500">import</span>{' '}
          <span className="text-blue-400">
            {'{'} Button {'}'}
          </span>{' '}
          <span className="text-gray-500">from</span>{' '}
          <span className="text-green-400">'@repo/ui/button/button'</span>
          <span className="text-gray-300">;</span>
          {'\n\n'}
          <span className="text-purple-400">export default function</span>{' '}
          <span className="text-yellow-400">Page</span>
          <span className="text-gray-300">() {'{'}</span>
          {'\n'}
          <span className="text-purple-400"> return</span>{' '}
          <span className="text-gray-300">(</span>
          {'\n'}
          <span className="text-gray-300"> {'<'}</span>
          <span className="text-pink-400">Button</span>
          <span className="text-gray-300">{'>'}Mon bouton</span>
          <span className="text-gray-300">{'</'}</span>
          <span className="text-pink-400">Button</span>
          <span className="text-gray-300">{'>'}</span>
          {'\n'}
          <span className="text-gray-300"> );</span>
          {'\n'}
          <span className="text-gray-300">{'}'}</span>
        </StyledTerminal>
      </div>

      <StyledTerminal
        title=""
        variant="custom"
        contentClassName="p-6 bg-gray-900"
      >
        <p className="text-xs text-gray-400 mb-4">{t('resultLabel')}</p>

      </StyledTerminal>
      <Button>{t('buttonLabel')}</Button>
    </div>
  );
}
