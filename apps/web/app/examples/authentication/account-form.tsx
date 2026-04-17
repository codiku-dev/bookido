'use client';

import { useTranslations } from 'next-intl';
import { useSession, signOut } from '@web/libs/auth-client';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button/button';
import { Label } from '@repo/ui/components/label';
import { cn } from '@repo/ui/utils/cn';

function AccountCodeBlock() {
  return (
    <div className="min-w-0 h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
      <div className="bg-gray-800 px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2 min-w-0 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-hidden">
          <div className="flex gap-1 shrink-0">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500" />
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500" />
          </div>
          <span
            className="text-[9px] sm:text-xs text-gray-400 truncate min-w-0"
            title="apps/web/app/to-delete/authentication/account-form.tsx"
          >
            apps/web/.../account-form.tsx
          </span>
        </div>
        <Badge >Client</Badge>
      </div>
      <div className="p-2 sm:p-4 overflow-auto min-w-0 flex-1 min-h-0">
        <pre className="text-[10px] sm:text-xs font-mono leading-snug text-gray-300 min-w-max">
          <code>
            <span className="text-purple-400">const</span>{' '}
            <span className="text-gray-300">{'{ data: session }'}</span>{' '}
            <span className="text-gray-300">= useSession();</span>
            {'\n\n'}
            <span className="text-gray-300">signOut();</span>
          </code>
        </pre>
      </div>
    </div>
  );
}

export function AccountForm(p: { className?: string }) {
  const t = useTranslations('Landing.step8');
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 lg:grid-cols-3 gap-4 w-full min-w-0 items-stretch',
          p.className,
        )}
      >
        <div className="min-w-0 h-full min-h-[280px]">
          <AccountCodeBlock />
        </div>
        <div className="min-w-0 h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden border border-gray-800 min-h-[280px]">
          <div className="bg-gray-800 px-3 sm:px-4 py-2 border-b border-gray-700 shrink-0">
            <span className="text-xs font-medium text-gray-300">Demo</span>
          </div>
          <div className="p-4 bg-white text-gray-900 flex-1 min-h-0 overflow-auto">
            <p className="text-sm text-gray-600">Loading session…</p>
          </div>
        </div>
        <div className="min-w-0 h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden border border-gray-800 min-h-[280px]">
          <div className="bg-gray-800 px-3 sm:px-4 py-2 border-b border-gray-700 shrink-0">
            <span className="text-xs font-medium text-gray-300">Réponse</span>
          </div>
          <div className="p-4 bg-gray-900 flex-1 min-h-0 overflow-auto">
            <pre className="text-[10px] sm:text-xs font-mono text-gray-300 rounded bg-gray-800 p-3 min-h-[80px]">
              —
            </pre>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 lg:grid-cols-3 gap-4 w-full min-w-0 items-stretch',
          p.className,
        )}
      >
        <div className="min-w-0 h-full min-h-[280px]">
          <AccountCodeBlock />
        </div>
        <div className="min-w-0 h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden border border-gray-800 min-h-[280px]">
          <div className="bg-gray-800 px-3 sm:px-4 py-2 border-b border-gray-700 shrink-0">
            <span className="text-xs font-medium text-gray-300">Demo</span>
          </div>
          <div className="p-4 bg-white text-gray-900 flex-1 min-h-0 overflow-auto">
            <p className="text-sm text-gray-600">
              {t('accountNotSignedIn')}
            </p>
          </div>
        </div>
        <div className="min-w-0 h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden border border-gray-800 min-h-[280px]">
          <div className="bg-gray-800 px-3 sm:px-4 py-2 border-b border-gray-700 shrink-0">
            <span className="text-xs font-medium text-gray-300">Réponse</span>
          </div>
          <div className="p-4 bg-gray-900 flex-1 min-h-0 overflow-auto">
            <pre className="text-[10px] sm:text-xs font-mono text-gray-300 rounded bg-gray-800 p-3 min-h-[80px]">
              —
            </pre>
          </div>
        </div>
      </div>
    );
  }

  const user = session.user;

  return (
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-3 gap-4 w-full min-w-0 items-stretch',
        p.className,
      )}
    >
      <div className="min-w-0 h-full min-h-[280px]">
        <AccountCodeBlock />
      </div>
      <div className="min-w-0 h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden border border-gray-800 min-h-[280px]">
        <div className="bg-gray-800 px-3 sm:px-4 py-2 border-b border-gray-700 shrink-0">
          <span className="text-xs font-medium text-gray-300">Demo</span>
        </div>
        <div className="p-4 bg-white text-gray-900 flex-1 min-h-0 overflow-auto">
          <div className="space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="space-y-1.5">
                <Label className="font-normal">Name</Label>
                <p className="font-medium text-gray-900">{user.name ?? '—'}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="font-normal">Email</Label>
                <p className="font-medium text-gray-900">{user.email ?? '—'}</p>
              </div>
            </div>
            <Button type="button" variant="default" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
      <div className="min-w-0 h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden border border-gray-800 min-h-[280px]">
        <div className="bg-gray-800 px-3 sm:px-4 py-2 border-b border-gray-700 shrink-0">
          <span className="text-xs font-medium text-gray-300">Réponse</span>
        </div>
        <div className="p-4 bg-gray-900 flex-1 min-h-0 overflow-auto">
          <pre className="text-[10px] sm:text-xs font-mono text-gray-300 rounded bg-gray-800 p-3 overflow-x-auto min-h-[80px]">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
