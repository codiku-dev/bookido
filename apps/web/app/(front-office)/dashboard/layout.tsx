"use client";

import type { ReactNode } from "react";
import DashboardLayout from "./_components/DashboardLayout";

export default function Layout(p: { children: ReactNode }) {
  return <DashboardLayout>{p.children}</DashboardLayout>;
}
