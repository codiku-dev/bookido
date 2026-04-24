"use client";

import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

export function PublicCoachBanner(p: { name: string; bio: string | null; imageUrl: string | null }) {
  const t = useTranslations();
  const bioText = p.bio?.trim() || t("public.booking.coachBioFallback");

  const avatarBlock = (
    <Avatar className="size-20 shrink-0 border border-slate-200 shadow-sm">
      {p.imageUrl ? <AvatarImage src={p.imageUrl} alt="" className="object-cover" /> : null}
      <AvatarFallback className="bg-slate-100 text-lg font-semibold text-slate-700">{initialsFromName(p.name)}</AvatarFallback>
    </Avatar>
  );

  const textBlock = (
    <div className="min-w-0 flex-1 text-center md:text-left">
      <p className="text-xs font-medium uppercase tracking-wide text-blue-700">{t("public.booking.coachSectionLabel")}</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">{p.name}</h1>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 md:text-base">{bioText}</p>
    </div>
  );

  return (
    <div className="mb-8 flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:gap-6">
      {avatarBlock}
      {textBlock}
    </div>
  );
}
