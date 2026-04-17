'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { authClient } from '@web/libs/auth-client';
import { Button } from '@repo/ui/components/button/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8),
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordCallbackPage() {
  const t = useTranslations('Landing.step8');
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<unknown>(null);
  const [token, setToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
    },
  });

  useEffect(() => {
    const queryToken = searchParams.get('token');
    setToken(queryToken);
    if (!queryToken) {
      setStatus('error');
    }
  }, [searchParams]);

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) {
      setStatus('error');
      return;
    }

    setStatus('idle');
    const res = await authClient.resetPassword({
      newPassword: values.newPassword,
      token,
    });
    setResult(res ?? null);

    if (res?.error) {
      setStatus('error');
      return;
    }

    setStatus('success');
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-3">
          <h1 className="text-xl font-semibold">{t('resetCallbackErrorTitle')}</h1>
          <p className="text-sm text-zinc-300">{t('resetCallbackMissingToken')}</p>
        </div>
      </main>
    );
  }

  if (status === 'success') {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-3">
          <h1 className="text-xl font-semibold">{t('resetCallbackSuccessTitle')}</h1>
          <p className="text-sm text-zinc-300">{t('resetCallbackSuccessDescription')}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-5">
        <h1 className="text-xl font-semibold">{t('resetCallbackFormTitle')}</h1>
        <p className="text-sm text-zinc-300">{t('resetCallbackFormDescription')}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">{t('newPasswordLabel')}</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="password1234"
              {...register('newPassword')}
            />
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('resetCallbackSubmitting') : t('resetCallbackSubmit')}
          </Button>
        </form>

        {status === 'error' && (
          <p className="text-sm text-red-400">{t('resetCallbackErrorDescription')}</p>
        )}

        <pre className="text-[10px] sm:text-xs font-mono text-gray-300 rounded bg-gray-800 p-3 overflow-x-auto min-h-[80px]">
          {result != null ? JSON.stringify(result, null, 2) : '—'}
        </pre>
      </div>
    </main>
  );
}

