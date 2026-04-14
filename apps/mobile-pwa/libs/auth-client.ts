import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

/** Explicit client type so exported bindings stay portable (declaration emit). */
type MobilePwaAuthClient = ReturnType<typeof createAuthClient<{
  baseURL: string;
  plugins: ReturnType<typeof adminClient>[];
}>>;

const authClient: MobilePwaAuthClient = createAuthClient({
  baseURL: `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/auth`,
  plugins: [adminClient()],
});

export const useSession: MobilePwaAuthClient["useSession"] = authClient.useSession;
export const signIn: MobilePwaAuthClient["signIn"] = authClient.signIn;
export const signUp: MobilePwaAuthClient["signUp"] = authClient.signUp;
export const signOut: MobilePwaAuthClient["signOut"] = authClient.signOut;
export { authClient };