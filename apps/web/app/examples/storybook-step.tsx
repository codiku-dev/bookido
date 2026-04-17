'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Badge } from '@repo/ui/components/badge';
import { StyledTerminal } from '@web/app/examples/components/StyledTerminal';

export function StorybookStep() {
  const t = useTranslations('Landing.step3');

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <StyledTerminal
        title="packages/ui/src/button/button.stories.tsx"
        badge={<Badge >{t('uiPackageSide')}</Badge>}
      >
        <span className="text-gray-500">import type</span>{' '}
        <span className="text-blue-400">
          {'{'} Meta, StoryObj {'}'}
        </span>{' '}
        <span className="text-gray-500">from</span>{' '}
        <span className="text-green-400">'@storybook/react'</span>
        <span className="text-gray-300">;</span>
        {'\n'}
        <span className="text-gray-500">import</span>{' '}
        <span className="text-blue-400">
          {'{'} Button {'}'}
        </span>{' '}
        <span className="text-gray-500">from</span>{' '}
        <span className="text-green-400">'./button'</span>
        <span className="text-gray-300">;</span>
        {'\n\n'}
        <span className="text-purple-400">const</span>{' '}
        <span className="text-blue-400">meta</span>
        <span className="text-gray-300">: </span>
        <span className="text-blue-400">Meta</span>
        <span className="text-gray-300">&lt;</span>
        <span className="text-blue-400">typeof</span>{' '}
        <span className="text-yellow-400">Button</span>
        <span className="text-gray-300">&gt; = </span>
        <span className="text-gray-300">{'{'}</span>
        <span className="text-gray-300">{'\n'}</span>
        <span className="text-gray-300"> </span>
        <span className="text-blue-400">title</span>
        <span className="text-gray-300">: </span>
        <span className="text-green-400">'UI/Button'</span>
        <span className="text-gray-300">,</span>
        {'\n'}
        <span className="text-gray-300"> </span>
        <span className="text-blue-400">component</span>
        <span className="text-gray-300">: </span>
        <span className="text-yellow-400">Button</span>
        <span className="text-gray-300">,</span>
        {'\n'}
        <span className="text-gray-300">{'}'}</span>
        <span className="text-gray-300">;</span>
        {'\n\n'}
        <span className="text-purple-400">export default</span>{' '}
        <span className="text-blue-400">meta</span>
        <span className="text-gray-300">;</span>
      </StyledTerminal>

      <StyledTerminal
        title="Storybook"
        variant="custom"
        contentClassName="p-0"
        className="shadow-lg"
      >
        <Image
          src="/sb.png"
          alt="Storybook screenshot"
          width={1200}
          height={800}
          className="w-full h-auto"
          priority
        />
      </StyledTerminal>
    </div>
  );
}
