import { Button } from '@repo/ui/components/button/button';
import { signIn } from '@web/libs/auth-client';
import { getAuthCallbackURL } from '@web/utils/auth-callback-url';
import { LogIn } from 'lucide-react';
export function GoogleForm() {
  return (
    <Button
      onClick={() =>
        signIn.social({
          provider: 'google',
          callbackURL: getAuthCallbackURL('/examples/authentication') || undefined,
        })
      }
    >
      <LogIn /> Sign in with Google
    </Button>
  );
}
