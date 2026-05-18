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

export function PublicCoachBanner(p: { name: string; bio: string | null; imageUrl: string | null; compact?: boolean }) {
  const t = useTranslations();
  const compact = p.compact === true;
  const bioText = p.bio?.trim() || t("public.booking.coachBioFallback");

  const mobileAvatarBlock = (
    <Avatar className="size-12 shrink-0 border border-white/50 shadow-md ring-2 ring-white/30">
      {p.imageUrl ? <AvatarImage src={p.imageUrl} alt="" className="object-cover" /> : null}
      <AvatarFallback className="bg-white/90 text-sm font-semibold text-slate-700">
        {initialsFromName(p.name)}
      </AvatarFallback>
    </Avatar>
  );

  const desktopAvatarBlock = compact ? (
    <Avatar className="size-12 shrink-0 border-2 border-white shadow-md ring-2 ring-blue-100/80 sm:size-14">
      {p.imageUrl ? <AvatarImage src={p.imageUrl} alt="" className="object-cover" /> : null}
      <AvatarFallback className="bg-linear-to-br from-slate-100 to-slate-200 text-sm font-semibold text-slate-700">
        {initialsFromName(p.name)}
      </AvatarFallback>
    </Avatar>
  ) : (
    <Avatar className="size-16 shrink-0 border-2 border-white shadow-lg ring-4 ring-blue-100/80 sm:size-20">
      {p.imageUrl ? <AvatarImage src={p.imageUrl} alt="" className="object-cover" /> : null}
      <AvatarFallback className="bg-linear-to-br from-slate-100 to-slate-200 text-base font-semibold text-slate-700 sm:text-lg md:text-xl">
        {initialsFromName(p.name)}
      </AvatarFallback>
    </Avatar>
  );

  const mobileTextBlock = (
    <div className="min-w-0 flex-1 text-left">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/85">
        {t("public.booking.coachSectionLabel")}
      </p>
      <h1 className="mt-0.5 text-lg font-bold tracking-tight text-white">{p.name}</h1>
      <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-white/90">{bioText}</p>
    </div>
  );

  const desktopTextBlock = compact ? (
    <div className="min-w-0 flex-1 text-left">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600/90">
        {t("public.booking.coachSectionLabel")}
      </p>
      <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{p.name}</h1>
      <p className="mt-1 max-w-2xl whitespace-pre-wrap text-xs leading-snug text-slate-600 sm:line-clamp-2 sm:text-sm">
        {bioText}
      </p>
    </div>
  ) : (
    <div className="min-w-0 flex-1 text-left">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600/90">
        {t("public.booking.coachSectionLabel")}
      </p>
      <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">{p.name}</h1>
      <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-slate-600 sm:mt-3 sm:line-clamp-4 sm:text-base md:leading-relaxed">
        {bioText}
      </p>
    </div>
  );

  const mobileBanner = (
    <div className="relative mb-5 overflow-hidden rounded-3xl bg-linear-to-br from-blue-600 via-blue-600 to-cyan-500 p-4 shadow-lg ring-1 ring-blue-500/30 md:hidden">
      <div
        className="pointer-events-none absolute -right-6 top-0 h-32 w-32 rounded-full bg-white/15 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-cyan-300/25 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-start gap-3">
        {mobileAvatarBlock}
        {mobileTextBlock}
      </div>
    </div>
  );

  const desktopBanner = compact ? (
    <div className="relative mb-0 hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-white via-white to-blue-50/60 p-4 shadow-sm ring-1 ring-slate-900/3 md:flex md:items-start md:gap-4 md:p-4">
      <div
        className="pointer-events-none absolute -right-8 top-0 h-28 w-28 rounded-full bg-blue-400/18 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-cyan-400/12 blur-2xl"
        aria-hidden
      />
      <div className="relative flex w-full items-start gap-3 sm:gap-4">
        {desktopAvatarBlock}
        {desktopTextBlock}
      </div>
    </div>
  ) : (
    <div className="relative mb-6 hidden overflow-hidden rounded-3xl border border-slate-200/90 bg-linear-to-br from-white via-white to-blue-50/70 p-5 shadow-lg ring-1 ring-slate-900/4 sm:mb-8 sm:p-6 md:flex md:items-start md:gap-6 md:p-8">
      <div
        className="pointer-events-none absolute -right-12 top-0 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl"
        aria-hidden
      />
      <div className="relative flex w-full items-start gap-4 sm:gap-5 md:gap-6">
        {desktopAvatarBlock}
        {desktopTextBlock}
      </div>
    </div>
  );

  return (
    <>
      {mobileBanner}
      {desktopBanner}
    </>
  );
}
