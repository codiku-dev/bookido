import { Suspense } from "react";
import { ResetPasswordCallbackContent } from "@/app/examples/authentication/reset-password-callback/reset-password-callback-content";

export default function ResetPasswordCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-6">
          <p className="text-sm text-zinc-400">Loading…</p>
        </main>
      }
    >
      <ResetPasswordCallbackContent />
    </Suspense>
  );
}
