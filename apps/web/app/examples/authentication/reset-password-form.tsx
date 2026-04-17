'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { authClient } from '@web/libs/auth-client';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { cn } from '@repo/ui/utils/cn';
import { StyledTerminal } from '@web/app/examples/components/StyledTerminal';

const requestResetSchema = z.object({
  email: z.string().email(),
});

type RequestResetValues = z.infer<typeof requestResetSchema>;

function RequestResetCodeBlock() {
  return (
    <StyledTerminal
      title="apps/web/.../reset-password-form.tsx"
      titleTitle="apps/web/app/examples/authentication/reset-password-form.tsx"
      badge={<Badge >Client</Badge>}
      size="sm"
      fill
      contentPadding="compact"
      contentClassName="p-2 sm:p-4 overflow-auto min-w-0 flex-1 min-h-0"
      preClassName="leading-snug min-w-max"
    >
      <span className="text-purple-400">await</span>{' '}
      authClient.requestPasswordReset({'{\n'}
      {'  '}email: <span className="text-blue-400">values.email</span>,{'\n'}
      {'  '}redirectTo:{' '}
      <span className="text-blue-400">
        {`window.location.origin + '/examples/authentication/reset-password-callback'`}
      </span>
      ,{'\n'}
      <span className="text-gray-300">{'}'});</span>
    </StyledTerminal>
  );
}

export function ResetPasswordForm(p: {
  className?: string;
  defaultEmail?: string;
}) {
  const t = useTranslations('Landing.step8');
  const [result, setResult] = useState<unknown>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestResetValues>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: p.defaultEmail ?? '' },
  });

  const onSubmit = async (values: RequestResetValues) => {
    setResult(null);
    try {
      const redirectTo = `${window.location.origin}/examples/authentication/reset-password-callback`;
      const res = await authClient.requestPasswordReset({
        email: values.email,
        redirectTo,
      });
      setResult(res ?? null);
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

  return (
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-3 gap-4 w-full min-w-0 items-stretch',
        p.className,
      )}
    >
      <div className="min-w-0 h-full min-h-[280px] flex flex-col">
        <RequestResetCodeBlock />
      </div>
      <div className="min-w-0 h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden border border-gray-800 min-h-[280px]">
        <div className="bg-gray-800 px-3 sm:px-4 py-2 border-b border-gray-700 shrink-0">
          <span className="text-xs font-medium text-gray-300">
            {t('demoLabel')}
          </span>
        </div>
        <div className="p-4 bg-white text-gray-900 flex-1 min-h-0 overflow-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="request-reset-email" className="text-gray-900">
                {t('emailLabel')}
              </Label>
              <Input
                id="request-reset-email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t('resetRequestLoading')
                : t('resetRequestSubmit')}
            </Button>
          </form>
        </div>
      </div>
      <div className="min-w-0 h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden border border-gray-800 min-h-[280px]">
        <div className="bg-gray-800 px-3 sm:px-4 py-2 border-b border-gray-700 shrink-0">
          <span className="text-xs font-medium text-gray-300">
            {t('responseLabel')}
          </span>
        </div>
        <div className="p-4 bg-gray-900 flex-1 min-h-0 overflow-auto">
          <pre className="text-[10px] sm:text-xs font-mono text-gray-300 rounded bg-gray-800 p-3 overflow-x-auto min-h-[80px]">
            {result != null ? JSON.stringify(result, null, 2) : '—'}
          </pre>
        </div>
      </div>
    </div>
  );
}
