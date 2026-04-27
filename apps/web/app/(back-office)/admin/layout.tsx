"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AdminLayout from "./_components/AdminLayout";

export default function Layout(p: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthShellExcluded =
    pathname === "/admin/signin" ||
    pathname === "/admin/signup" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/reset-password" ||
    pathname === "/admin/onboarding";

  if (isAuthShellExcluded) {
    return <>{p.children}</>;
  }

  return <AdminLayout>{p.children}</AdminLayout>;
}
