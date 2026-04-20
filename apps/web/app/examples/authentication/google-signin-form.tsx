import { Button } from '@repo/ui/components/button/button';
import { signIn } from '@web/libs/auth-client';
import { LogIn } from 'lucide-react';
export function GoogleForm() {
  return (
    <Button
      onClick={() =>
        signIn.social({
          provider: 'google',
          callbackURL: process.env["NEXT_PUBLIC_GOOGLE_AUTH_CALLBACK_URL"],
        })
      }
    >
      <LogIn /> Sign in with Google
    </Button>
  );
}
