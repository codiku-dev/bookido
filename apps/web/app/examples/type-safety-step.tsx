'use client';

import { useTranslations } from 'next-intl';
import { trpc } from '@web/libs/trpc-client';
import { Badge } from '@repo/ui/components/badge';
import { StyledTerminal } from '@web/app/examples/components/StyledTerminal';

export function TypeSafetyStep() {
  const t = useTranslations('Landing.step1');
  const { data, isLoading, refetch } = trpc.app.hello.useQuery(undefined, {
    enabled: false,
  });

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <StyledTerminal
          title="apps/api/src/features/users/users.router.ts"
          badge={<Badge >{t('backendSide')}</Badge>}
        >
          <span className="text-purple-400">@Router</span>
          <span className="text-gray-300">( </span>
          <span className="text-blue-400">alias</span>
          <span className="text-gray-300">: </span>
          <span className="text-green-400">'users'</span>
          <span className="text-gray-300">{'}'})</span>
          {'\n'}
          <span className="text-purple-400">export class</span>{' '}
          <span className="text-yellow-400">UserRouter</span>{' '}
          <span className="text-gray-300">{'{'}</span>
          {'\n'}
          <span className="text-gray-300"> </span>
          <span className="text-purple-400">@Query</span>
          <span className="text-gray-300">({'{'}</span>
          {'\n'}
          <span className="text-gray-300"> </span>
          <span className="text-blue-400">output</span>
          <span className="text-gray-300">: </span>
          <span className="text-blue-400">z</span>
          <span className="text-gray-300">.</span>
          <span className="text-yellow-400">array</span>
          <span className="text-gray-300">(</span>
          <span className="text-blue-400">usersSchema</span>
          <span className="text-gray-300">),</span>
          {'\n'}
          <span className="text-gray-300"> {'}'})</span>
          {'\n'}
          <span className="text-purple-400"> readAll</span>
          <span className="text-gray-300">() {'{'}</span>
          {'\n'}
          <span className="text-purple-400"> return</span>{' '}
          <span className="text-blue-400">this</span>
          <span className="text-gray-300">.</span>
          <span className="text-yellow-400">usersService</span>
          <span className="text-gray-300">.</span>
          <span className="text-yellow-400">findAll</span>
          <span className="text-gray-300">();</span>
          {'\n'}
          <span className="text-gray-300"> {'}'}</span>
          {'\n'}
          <span className="text-gray-300">{'}'}</span>
        </StyledTerminal>

        <StyledTerminal
          title="apps/web/app/page.tsx"
          badge={<Badge >{t('frontendSide')}</Badge>}
        >
          <span className="text-gray-500">'use client'</span>
          <span className="text-gray-300">;</span>
          {'\n'}
          <span className="text-gray-500">import</span>{' '}
          <span className="text-blue-400">
            {'{'} trpc {'}'}
          </span>{' '}
          <span className="text-gray-500">from</span>{' '}
          <span className="text-green-400">'@web/libs/trpc-client'</span>
          <span className="text-gray-300">;</span>
          {'\n\n'}
          <span className="text-purple-400">export default function</span>{' '}
          <span className="text-yellow-400">MyPage</span>
          <span className="text-gray-300">() {'{'}</span>
          {'\n'}
          <span className="text-gray-300"> </span>
          <span className="text-gray-500">// ✨ Autocomplétion complète</span>
          {'\n'}
          <span className="text-gray-300"> </span>
          <span className="text-purple-400">const</span>{' '}
          <span className="text-blue-400">
            {'{'} data, isLoading {'}'}
          </span>{' '}
          <span className="text-purple-400">=</span>{' '}
          <span className="text-blue-400">trpc</span>
          <span className="text-gray-300">.</span>
          <span className="text-yellow-400">users</span>
          <span className="text-gray-300">.</span>
          <span className="text-yellow-400">readAll</span>
          <span className="text-gray-300">.</span>
          <span className="text-yellow-400">useQuery</span>
          <span className="text-gray-300">();</span>
          {'\n\n'}
          <span className="text-purple-400"> return</span>{' '}
          <span className="text-gray-300">(</span>
          {'\n'}
          <span className="text-gray-300"> {'<'}</span>
          <span className="text-pink-400">div</span>
          <span className="text-gray-300">{'>'}</span>
          {'\n'}
          <span className="text-gray-300"> {'{'}isLoading ? </span>
          <span className="text-green-400">'Loading...'</span>
          <span className="text-gray-300"> : </span>
          <span className="text-blue-400">JSON</span>
          <span className="text-gray-300">.</span>
          <span className="text-yellow-400">stringify</span>
          <span className="text-gray-300">(data){'}'}</span>
          {'\n'}
          <span className="text-gray-300"> {'</'}</span>
          <span className="text-pink-400">div</span>
          <span className="text-gray-300">{'>'}</span>
          {'\n'}
          <span className="text-gray-300"> );</span>
          {'\n'}
          <span className="text-gray-300">{'}'}</span>
        </StyledTerminal>
      </div>

      <StyledTerminal
        title="Demo"
        badge={<Badge >{t('result')}</Badge>}
        variant="custom"
        contentClassName="p-6 bg-white"
      >
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Loading...' : 'Fetch data'}
        </button>
        <div className="mt-4">
          {isLoading ? (
            <p className="text-gray-700">Loading...</p>
          ) : data ? (
            <pre className="text-xs font-mono bg-gray-50 text-gray-900 p-3 sm:p-4 rounded border border-gray-200 overflow-x-auto max-w-full">
              <code>{JSON.stringify(data, null, 2)}</code>
            </pre>
          ) : (
            <p className="text-gray-700 text-sm">
              Click the button to fetch data
            </p>
          )}
        </div>
      </StyledTerminal>
    </div>
  );
}
