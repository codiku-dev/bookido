'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@repo/ui/components/badge';
import { StyledTerminal } from '@web/app/examples/components/StyledTerminal';

export function LoggingStep() {
  const t = useTranslations('Landing.step9');

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <StyledTerminal
        title="apps/api/.../users.router.ts"
        titleTitle="apps/api/src/features/users/users.router.ts"
        badge={<Badge >{t('codeLabel')}</Badge>}
      >
        <span className="text-purple-400">@AuthGuard</span>
        <span className="text-gray-300">({' {'} alias: </span>
        <span className="text-blue-400">'users, </span>
        <span className="border-2 border-green-400 p-1">
          <span className="text-gray-300"> logs: </span>
          <span className="text-amber-400">true</span>
        </span>
        <span className="text-gray-300"> {'}'})</span>
        {'\n'}
        <span className="text-gray-300">export class</span>
        <span className="text-gray-300"> UserRouter </span>
        <span className="text-gray-300">{'{'}</span>
        {'\n'}
        <span className="text-gray-300"> </span>
        <span className="text-gray-300">@Query</span>
        <span className="text-gray-300">(...)</span>
        {'\n'}
        <span className="text-gray-300"> </span>
        <span className="text-gray-300">async</span>
        <span className="text-gray-300"> read</span>
        <span className="text-gray-300">
          (...) {'{'} ... {'}'}
        </span>
        {'\n'}
        <span className="text-gray-300">{'}'}</span>
      </StyledTerminal>

      <StyledTerminal
        title="api:dev"
        badge={<Badge >{t('terminalLabel')}</Badge>}
        size="sm"
        contentPadding="compact"
        preClassName="whitespace-pre"
      >
        <span className="text-gray-400">
          ────────────────────────────────────────────────────────
        </span>
        {'\n  '}
        <span className="text-gray-200">URL</span>
        {'\n'}
        <span className="text-gray-400">
          ────────────────────────────────────────────────
        </span>
        {'\n  '}
        <span className="text-cyan-300">
          http://localhost:3090/trpc/users.read
        </span>
        {'\n\n  '}
        <span className="text-gray-200">META</span>
        {'\n'}
        <span className="text-gray-400">
          ────────────────────────────────────────────────
        </span>
        {'\n  '}
        <span className="text-gray-500">path </span>
        <span className="text-gray-300">users.read</span>
        {'\n  '}
        <span className="text-gray-500">type </span>
        <span className="text-gray-300">query</span>
        {'\n  '}
        <span className="text-gray-500">duration </span>
        <span className="text-gray-300">40 ms</span>
        {'\n\n  '}
        <span className="text-red-400">RESPONSE (error)</span>
        {'\n'}
        <span className="text-gray-400">
          ────────────────────────────────────────────────
        </span>
        {'\n  '}
        <span className="text-gray-300">{'{'}</span>
        {'\n    '}
        <span className="text-gray-500">"cause"</span>
        <span className="text-gray-300">: {'{'}</span>
        {'\n      '}
        <span className="text-gray-500">"message"</span>
        <span className="text-gray-300">: </span>
        <span className="text-yellow-300">"User with ID 1 not found"</span>
        <span className="text-gray-300">,</span>
        {'\n      '}
        <span className="text-gray-500">"name"</span>
        <span className="text-gray-300">: </span>
        <span className="text-yellow-300">"NotFoundException"</span>
        {'\n    '}
        <span className="text-gray-300">{'}'},</span>
        {'\n    '}
        <span className="text-gray-500">"code"</span>
        <span className="text-gray-300">: </span>
        <span className="text-yellow-300">"INTERNAL_SERVER_ERROR"</span>
        <span className="text-gray-300">,</span>
        {'\n    '}
        <span className="text-gray-500">"name"</span>
        <span className="text-gray-300">: </span>
        <span className="text-yellow-300">"TRPCError"</span>
        {'\n  '}
        <span className="text-gray-300">{'}'}</span>
      </StyledTerminal>
    </div>
  );
}
