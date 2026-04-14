import { SimpleCodeCard } from '@/app/examples/components/simple-code-card';
import { Badge } from '@repo/ui/components/badge';
import { useTranslations } from 'next-intl';

export function EmailAuthEventsHook() {
  const t = useTranslations('Authentication.authEvents');
  return (
    <SimpleCodeCard
      title="apps/api/infrastructure/auth/hooks/signup-hook.ts"
      badge={<Badge >API</Badge>}
    >
      <span className="text-emerald-400 border border-emerald-500/50 px-1 rounded text-[10px] sm:text-xs">
        Auth events hook — {t('description')}
      </span>
      {'\n'}
      <span className="text-purple-400">@BeforeHook</span>
      <span className="text-gray-300">(</span>
      <span className="text-green-400">&quot;/sign-up/email&quot;</span>
      <span className="text-gray-300">)</span>
      {'\n'}
      <span className="text-purple-400">async</span>
      <span className="text-gray-300"> handle(ctx: AuthHookContext) </span>
      <span className="text-gray-300">{'{'}</span>
      {'\n'}
      <span className="text-gray-300"> </span>

      {'\n'}
      <span className="text-gray-300"> return ctx;</span>
      {'\n'}
      <span className="text-gray-300">{'}'}</span>
      {'\n\n'}
      <span className="text-purple-400">@BeforeHook</span>
      <span className="text-gray-300">(</span>
      <span className="text-green-400">&quot;/sign-in/email&quot;</span>
      <span className="text-gray-300">)</span>
      {'\n'}
      <span className="text-purple-400">async</span>
      <span className="text-gray-300"> handle(ctx: AuthHookContext) </span>
      <span className="text-gray-300">{'{'}</span>
      {'\n'}
      <span className="text-gray-300"> </span>

      {'\n'}
      <span className="text-gray-300"> return ctx;</span>
      {'\n'}
      <span className="text-gray-300">{'}'}</span>
    </SimpleCodeCard>
  );
}
