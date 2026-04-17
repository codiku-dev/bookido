'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { SigninForm } from './email-signin-form';
import { SignupForm } from './email-signup-form';
import { AccountForm } from './account-form';
import { EmailAuthEventsHook } from './email-auth-events-hook';
import { GoogleForm } from './google-signin-form';
import { ResetPasswordForm } from './reset-password-form';

const DEMO_PASSWORD = 'password123';

function useDemoCredentials() {
  return useMemo(
    () => ({
      email: `demo-${Date.now()}@example.com`,
      password: DEMO_PASSWORD,
    }),
    [],
  );
}

export function AuthStep() {
  const t = useTranslations('Landing.step8');
  const { email: demoEmail, password: demoPassword } = useDemoCredentials();

  return (
    <div className="space-y-6">
      <div className="space-y-12">
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">
            {t('signupTitle')}
          </h3>
          <SignupForm defaultEmail={demoEmail} defaultPassword={demoPassword} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">
            {t('signinTitle')}
          </h3>
          <SigninForm defaultEmail={demoEmail} defaultPassword={demoPassword} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">
            {t('googleSigninTitle')}
          </h3>
          <GoogleForm />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">
            {t('accountTitle')}
          </h3>
          <AccountForm />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">
            {t('authEventsTitle')}
          </h3>
          <EmailAuthEventsHook />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">
            {t('resetPasswordTitle')}
          </h3>
          <ResetPasswordForm defaultEmail={demoEmail} />
        </div>
      </div>
    </div>
  );
}
