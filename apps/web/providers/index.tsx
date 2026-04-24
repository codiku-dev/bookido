"use client";
import { DevFormFillFloatingButton } from "#/components/dev/DevFormFillFloatingButton";
import { PublicStorefrontNavOriginTracker } from "@web/app/(front-office)/_components/PublicStorefrontNavOriginTracker";
import { ReactQueryProvider } from "./react-query-provider";
import { TrpcProvider } from "./trpc-provider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <TrpcProvider>
      <ReactQueryProvider>
        <PublicStorefrontNavOriginTracker />
        {children}
        <DevFormFillFloatingButton />
      </ReactQueryProvider>
    </TrpcProvider>
  );
};
