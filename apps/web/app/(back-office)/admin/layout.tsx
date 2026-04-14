"use client";

import type { ReactNode } from "react";
import AdminLayout from "./_components/AdminLayout";

export default function Layout(p: { children: ReactNode }) {
  return <AdminLayout>{p.children}</AdminLayout>;
}
