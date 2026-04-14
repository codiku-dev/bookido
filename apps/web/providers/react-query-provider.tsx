import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@web/libs/trpc-client';
export const ReactQueryProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};
