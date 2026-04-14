import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

/** Explicit client type so exported bindings stay portable (Next.js production typecheck). */
type WebAuthClient = ReturnType<typeof createAuthClient<{
  baseURL: string;
  plugins: ReturnType<typeof adminClient>[];
}>>;

const authClient: WebAuthClient = createAuthClient({
  baseURL: `${process.env["NEXT_PUBLIC_API_BASE_URL"] ?? ""}/api/auth`,
  plugins: [adminClient()],
});

export const useSession: WebAuthClient["useSession"] = authClient.useSession;
export const signIn: WebAuthClient["signIn"] = authClient.signIn;
export const signUp: WebAuthClient["signUp"] = authClient.signUp;
export const signOut: WebAuthClient["signOut"] = authClient.signOut;
export { authClient };
