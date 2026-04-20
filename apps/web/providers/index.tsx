"use client";
import { DevFormFillFloatingButton } from "#/components/dev/DevFormFillFloatingButton";
import { ReactQueryProvider } from "./react-query-provider";
import { TrpcProvider } from "./trpc-provider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <TrpcProvider>
      <ReactQueryProvider>
        {children}
        <DevFormFillFloatingButton />
      </ReactQueryProvider>
    </TrpcProvider>
  );
};
