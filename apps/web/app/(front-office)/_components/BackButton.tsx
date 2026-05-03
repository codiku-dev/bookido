"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

type BackButtonProps = {
  label: string;
  fallbackHref: string;
  className?: string;
  icon?: ReactNode;
  /** When set, skips router history and runs this (e.g. in-app preview modal). */
  onNavigate?: () => void;
};

export function BackButton(p: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (p.onNavigate) {
      p.onNavigate();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(p.fallbackHref);
  };

  const buttonIcon = p.icon ?? <span aria-hidden>←</span>;

  return (
    <button
      type="button"
      onClick={handleBack}
      className={
        p.className ?? "inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
      }
    >
      {buttonIcon}
      <span>{p.label}</span>
    </button>
  );
}
