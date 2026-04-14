import "@/styles/globals.css";
import type { Viewport } from "next";
import { Providers } from "@/providers";

// FULL SCREEN MODE (requires reload)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout(p: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-dvh">
        <Providers> {p.children}</Providers>
      </body>
    </html>
  );
}
