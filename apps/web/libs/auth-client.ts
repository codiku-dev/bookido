import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { createLocaleAwareFetch } from "@web/libs/auth-client-fetch";

/** Explicit client type so exported bindings stay portable (Next.js production typecheck). */
type WebAuthClient = ReturnType<typeof createAuthClient<{
  baseURL: string;
  plugins: ReturnType<typeof adminClient>[];
  fetchOptions: { customFetchImpl: typeof fetch };
}>>;

const authClient: WebAuthClient = createAuthClient({
  baseURL: `${process.env["NEXT_PUBLIC_API_BASE_URL"] ?? ""}/api/auth`,
  plugins: [adminClient()],
  fetchOptions: {
    customFetchImpl: createLocaleAwareFetch(),
  },
});

export const useSession: WebAuthClient["useSession"] = authClient.useSession;
export const signIn: WebAuthClient["signIn"] = authClient.signIn;
export const signUp: WebAuthClient["signUp"] = authClient.signUp;
export const signOut: WebAuthClient["signOut"] = authClient.signOut;
export const requestPasswordReset: WebAuthClient["requestPasswordReset"] = authClient.requestPasswordReset;
export const resetPassword: WebAuthClient["resetPassword"] = authClient.resetPassword;
export const updateUser: WebAuthClient["updateUser"] = authClient.updateUser;
export const changePassword: WebAuthClient["changePassword"] = authClient.changePassword;
export { authClient };
