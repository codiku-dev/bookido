import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@mobile/libs/trpc-client";

export function ReactQueryProvider(p: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{p.children}</QueryClientProvider>
  );
}
