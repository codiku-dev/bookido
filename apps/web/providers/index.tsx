"use client";
import { ReactQueryProvider } from './react-query-provider';
import { TrpcProvider } from './trpc-provider';

export const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <TrpcProvider>
            <ReactQueryProvider>
                {children}
            </ReactQueryProvider>
        </TrpcProvider>
    );
};
