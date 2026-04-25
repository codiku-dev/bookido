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

  const mobileAvatarBlock = (
    <Avatar className="size-12 shrink-0 border border-white/40 shadow-sm">
      {p.imageUrl ? <AvatarImage src={p.imageUrl} alt="" className="object-cover" /> : null}
      <AvatarFallback className="bg-white/90 text-sm font-semibold text-slate-700">{initialsFromName(p.name)}</AvatarFallback>
    </Avatar>
  );

  const desktopAvatarBlock = (
    <Avatar className="size-14 shrink-0 border border-slate-200 shadow-sm sm:size-16 md:size-20">
      {p.imageUrl ? <AvatarImage src={p.imageUrl} alt="" className="object-cover" /> : null}
      <AvatarFallback className="bg-slate-100 text-sm font-semibold text-slate-700 sm:text-base md:text-lg">
        {initialsFromName(p.name)}
      </AvatarFallback>
    </Avatar>
  );

  const mobileTextBlock = (
    <div className="min-w-0 flex-1 text-left">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">{t("public.booking.coachSectionLabel")}</p>
      <h1 className="mt-0.5 text-lg font-bold text-white">{p.name}</h1>
      <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-white/90">{bioText}</p>
    </div>
  );

  const desktopTextBlock = (
    <div className="min-w-0 flex-1 text-left">
      <p className="text-xs font-medium uppercase tracking-wide text-blue-700">{t("public.booking.coachSectionLabel")}</p>
      <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">{p.name}</h1>
      <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 sm:line-clamp-3 md:mt-3 md:line-clamp-none md:text-base">
        {bioText}
      </p>
    </div>
  );

  const mobileBanner = (
    <div className="mb-4 flex items-start gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 p-4 shadow-sm md:hidden">
      {mobileAvatarBlock}
      {mobileTextBlock}
    </div>
  );

  const desktopBanner = (
    <div className="mb-5 hidden items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mb-6 sm:gap-4 sm:p-5 md:mb-7 md:flex md:gap-6 md:p-6">
      {desktopAvatarBlock}
      {desktopTextBlock}
    </div>
  );

  return (
    <>
      {mobileBanner}
      {desktopBanner}
    </>
  );
}
