"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Banknote,
  CalendarCheck,
  CalendarDays,
  Check,
  CreditCard,
  LayoutDashboard,
  Link2,
  ListChecks,
  MousePointer2,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";

import BookidoLogo from "#/components/BookidoLogo";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { useSession } from "@web/libs/auth-client";

const HERO_MOCK_FLOW_MS = 20_000;
const HERO_MOCK_SLIDE_COUNT = 5;
const HERO_MOCK_CURSOR_TARGET_CELL = 10;

/** Keyframes aligned with `HeroMockCursor` pointer / hover overlay (hover → click → settle). */
const HERO_MOCK_TARGET_TIMES = [0, 0.38, 0.52, 0.62, 0.78, 1];
const HERO_MOCK_TARGET_MOTION = {
  duration: 2.8,
  times: HERO_MOCK_TARGET_TIMES,
  ease: "easeInOut" as const,
};

/** Calendar target cell: stay neutral longer, then hover tint, then click (blue + scale). */
const HERO_MOCK_CALENDAR_CELL_TIMES = [0, 0.32, 0.4, 0.5, 0.58, 0.72, 1];
const HERO_MOCK_CALENDAR_CELL_MOTION = {
  duration: HERO_MOCK_TARGET_MOTION.duration,
  times: HERO_MOCK_CALENDAR_CELL_TIMES,
  ease: HERO_MOCK_TARGET_MOTION.ease,
};

const HERO_MOCK_CALENDAR_NEUTRAL_BG = "rgb(241 245 249)";
const HERO_MOCK_CALENDAR_HOVER_BG = "rgb(226 232 240)";
const HERO_MOCK_CALENDAR_BLUE_BG = "rgb(37 99 235)";
const HERO_MOCK_CALENDAR_BLUE_DEEP = "rgb(29 78 216)";

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

function HeroMockCursor(p: {
  containerRef: RefObject<HTMLDivElement | null>;
  targetRef: RefObject<HTMLDivElement | null>;
}) {
  const [geom, setGeom] = useState<{
    dx: number;
    dy: number;
    rl: number;
    rt: number;
    rw: number;
    rh: number;
  } | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    let raf = 0;
    const measure = () => {
      if (cancelled) return;
      const c = p.containerRef.current;
      const t = p.targetRef.current;
      if (!c || !t) {
        raf = requestAnimationFrame(measure);
        return;
      }
      const cr = c.getBoundingClientRect();
      const tr = t.getBoundingClientRect();
      setGeom({
        dx: tr.left - cr.left + tr.width * 0.56,
        dy: tr.top - cr.top + tr.height * 0.44,
        rl: tr.left - cr.left,
        rt: tr.top - cr.top,
        rw: tr.width,
        rh: tr.height,
      });
    };
    measure();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [p.containerRef, p.targetRef]);

  if (!geom) return null;

  const targetHover = (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute z-[23] rounded-lg border border-slate-200/50 bg-slate-900/[0.03]"
      style={{ left: geom.rl, top: geom.rt, width: geom.rw, height: geom.rh }}
      initial={{ scale: 1, opacity: 0.28, boxShadow: "0 0 0 0 rgba(15, 23, 42, 0)" }}
      animate={{
        scale: [1, 1, 1.018, 1.042, 1.02, 1],
        opacity: [0.28, 0.42, 0.92, 0.78, 0.5, 0.36],
        boxShadow: [
          "0 0 0 0 rgba(15, 23, 42, 0)",
          "0 2px 10px -4px rgba(15, 23, 42, 0.12)",
          "0 12px 28px -6px rgba(37, 99, 235, 0.45)",
          "0 8px 20px -4px rgba(79, 70, 229, 0.35)",
          "0 4px 14px -4px rgba(37, 99, 235, 0.22)",
          "0 0 0 0 rgba(37, 99, 235, 0)",
        ],
        borderColor: [
          "rgba(148, 163, 184, 0.45)",
          "rgba(148, 163, 184, 0.55)",
          "rgba(59, 130, 246, 0.7)",
          "rgba(129, 140, 248, 0.55)",
          "rgba(96, 165, 250, 0.35)",
          "rgba(148, 163, 184, 0.4)",
        ],
        backgroundColor: [
          "rgba(15, 23, 42, 0.03)",
          "rgba(15, 23, 42, 0.055)",
          "rgba(37, 99, 235, 0.14)",
          "rgba(79, 70, 229, 0.1)",
          "rgba(37, 99, 235, 0.06)",
          "rgba(15, 23, 42, 0.04)",
        ],
      }}
      transition={HERO_MOCK_TARGET_MOTION}
    />
  );

  const pointerPosition = (
    <motion.div
      className="pointer-events-none absolute z-[25]"
      initial={{ left: 12, top: 62, opacity: 1 }}
      animate={{ left: geom.dx, top: geom.dy, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 78,
        damping: 14,
        mass: 0.52,
        opacity: { duration: 0.25 },
      }}
      style={{ marginLeft: -3, marginTop: -2 }}
    >
      <motion.div
        initial={{ scale: 1, rotate: 0 }}
        animate={{
          scale: [1, 1, 1.14, 0.93, 1.04, 1],
          rotate: [0, 0, -4, 3, -1, 0],
          filter: [
            "drop-shadow(0 2px 4px rgb(15 23 42 / 0.2))",
            "drop-shadow(0 2px 4px rgb(15 23 42 / 0.2))",
            "drop-shadow(0 0 14px rgb(37 99 235 / 0.55))",
            "drop-shadow(0 0 12px rgb(124 58 237 / 0.45))",
            "drop-shadow(0 0 10px rgb(37 99 235 / 0.35))",
            "drop-shadow(0 2px 5px rgb(15 23 42 / 0.22))",
          ],
          color: ["#0f172a", "#0f172a", "#2563eb", "#5b21b6", "#2563eb", "#0f172a"],
        }}
        transition={{
          duration: HERO_MOCK_TARGET_MOTION.duration,
          delay: 0.35,
          times: [0, 0.32, 0.48, 0.58, 0.72, 1],
          ease: HERO_MOCK_TARGET_MOTION.ease,
        }}
        className="text-slate-900"
      >
        <MousePointer2 className="size-7" fill="white" strokeWidth={1.35} />
      </motion.div>
    </motion.div>
  );

  return (
    <div className="pointer-events-none contents" aria-hidden>
      {targetHover}
      {pointerPosition}
    </div>
  );
}

function LandingHeroBrowserMock() {
  const t = useTranslations("public.landing");
  const prefersReducedMotion = useReducedMotion();
  const [slide, setSlide] = useState(0);
  const activeSlide = prefersReducedMotion ? 0 : slide;

  useEffect(() => {
    if (prefersReducedMotion) return;
    const stepMs = HERO_MOCK_FLOW_MS / HERO_MOCK_SLIDE_COUNT;
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % HERO_MOCK_SLIDE_COUNT);
    }, stepMs);
    return () => window.clearInterval(id);
  }, [prefersReducedMotion]);

  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const calendarTargetRef = useRef<HTMLDivElement>(null);
  const serviceContainerRef = useRef<HTMLDivElement>(null);
  const serviceTargetRef = useRef<HTMLDivElement>(null);
  const paymentContainerRef = useRef<HTMLDivElement>(null);
  const paymentPayRef = useRef<HTMLDivElement>(null);

  const heroMockCalendarCell = (p: { index: number; markerRef?: RefObject<HTMLDivElement | null> }) => {
    const isCursorTarget = p.index === HERO_MOCK_CURSOR_TARGET_CELL;
    const staticBlue = !isCursorTarget && p.index % 5 === 0;
    const staticBgClass = staticBlue ? "bg-blue-600" : p.index % 7 === 3 ? "bg-slate-200" : "bg-slate-100";

    const staticFill = <div className={`absolute inset-0 rounded-md ${staticBgClass}`} />;

    const animatedTargetFill = (
      <motion.div
        className="absolute inset-0 rounded-md"
        initial={
          prefersReducedMotion
            ? { scale: 1, backgroundColor: HERO_MOCK_CALENDAR_BLUE_BG }
            : { scale: 1, backgroundColor: HERO_MOCK_CALENDAR_NEUTRAL_BG }
        }
        animate={
          prefersReducedMotion
            ? { scale: 1, backgroundColor: HERO_MOCK_CALENDAR_BLUE_BG }
            : {
                scale: [1, 1, 1.02, 1.048, 1.065, 1.03, 1],
                backgroundColor: [
                  HERO_MOCK_CALENDAR_NEUTRAL_BG,
                  HERO_MOCK_CALENDAR_NEUTRAL_BG,
                  HERO_MOCK_CALENDAR_HOVER_BG,
                  HERO_MOCK_CALENDAR_BLUE_BG,
                  HERO_MOCK_CALENDAR_BLUE_BG,
                  HERO_MOCK_CALENDAR_BLUE_DEEP,
                  HERO_MOCK_CALENDAR_BLUE_BG,
                ],
                boxShadow: [
                  "0 0 0 0 rgb(15 23 42 / 0)",
                  "0 0 0 0 rgb(15 23 42 / 0)",
                  "0 1px 5px 0 rgb(15 23 42 / 0.08)",
                  "0 6px 16px -4px rgb(37 99 235 / 0.45)",
                  "0 4px 12px -2px rgb(79 70 229 / 0.3)",
                  "0 2px 8px -2px rgb(37 99 235 / 0.22)",
                  "0 0 0 0 rgb(37 99 235 / 0)",
                ],
              }
        }
        transition={prefersReducedMotion ? { duration: 0 } : HERO_MOCK_CALENDAR_CELL_MOTION}
      />
    );

    const cellFill = isCursorTarget && p.markerRef ? animatedTargetFill : staticFill;

    return (
      <div key={p.index} ref={p.markerRef} className="relative w-full min-w-0">
        <div className="block pb-[100%]" aria-hidden />
        {cellFill}
      </div>
    );
  };

  const heroMockCalendarGridEl = (
    <div className="grid min-h-[176px] grid-cols-7 content-start gap-1.5">
      {Array.from({ length: 21 }, (_, i) =>
        heroMockCalendarCell({
          index: i,
          markerRef: i === HERO_MOCK_CURSOR_TARGET_CELL ? calendarTargetRef : undefined,
        }),
      )}
    </div>
  );

  const heroMockPickRow = (p: {
    primary: string;
    secondary?: string;
    selected: boolean;
    rowRef?: RefObject<HTMLDivElement | null>;
  }) => (
    <div
      ref={p.rowRef}
      className={`rounded-xl px-3.5 py-2.5 transition-colors ${
        p.selected ? "bg-blue-600 text-white shadow-md shadow-blue-600/25" : "bg-slate-100 text-slate-600 hover:bg-slate-200/90"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug">{p.primary}</p>
          {p.secondary ? (
            <p className={`mt-0.5 text-xs leading-snug ${p.selected ? "text-white/85" : "text-slate-500"}`}>
              {p.secondary}
            </p>
          ) : null}
        </div>
        {p.selected ? <Check className="mt-0.5 size-4 shrink-0 opacity-95" strokeWidth={2.5} aria-hidden /> : null}
      </div>
    </div>
  );

  const heroMockServiceTargetRow = (
    <motion.div
      ref={serviceTargetRef}
      className="rounded-xl px-3.5 py-2.5 shadow-md"
      initial={
        prefersReducedMotion
          ? { scale: 1, backgroundColor: "rgb(37 99 235)", color: "rgb(255 255 255)" }
          : { scale: 1, backgroundColor: "rgb(241 245 249)", color: "rgb(71 85 105)" }
      }
      animate={
        prefersReducedMotion
          ? { scale: 1, backgroundColor: "rgb(37 99 235)", color: "rgb(255 255 255)" }
          : {
              scale: [1, 1, 1.012, 1.03, 1.014, 1],
              backgroundColor: [
                "rgb(241 245 249)",
                "rgb(226 232 240)",
                "rgb(37 99 235)",
                "rgb(37 99 235)",
                "rgb(29 78 216)",
                "rgb(37 99 235)",
              ],
              color: [
                "rgb(71 85 105)",
                "rgb(51 65 85)",
                "rgb(255 255 255)",
                "rgb(255 255 255)",
                "rgb(255 255 255)",
                "rgb(255 255 255)",
              ],
              boxShadow: [
                "0 0 0 0 rgb(37 99 235 / 0)",
                "0 1px 4px 0 rgb(15 23 42 / 0.05)",
                "0 8px 22px -6px rgb(37 99 235 / 0.38)",
                "0 6px 18px -4px rgb(79 70 229 / 0.28)",
                "0 4px 14px -4px rgb(37 99 235 / 0.2)",
                "0 2px 10px -4px rgb(37 99 235 / 0.22)",
              ],
            }
      }
      transition={prefersReducedMotion ? { duration: 0 } : HERO_MOCK_TARGET_MOTION}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug">{t("hero.mockSelectedServiceLong")}</p>
        </div>
        <motion.span
          className="inline-flex shrink-0"
          initial={{ opacity: prefersReducedMotion ? 1 : 0, scale: prefersReducedMotion ? 1 : 0.88 }}
          animate={
            prefersReducedMotion
              ? { opacity: 1, scale: 1 }
              : { opacity: [0, 0, 1, 1, 1, 1], scale: [0.88, 0.88, 1, 1, 1, 1] }
          }
          transition={prefersReducedMotion ? { duration: 0 } : HERO_MOCK_TARGET_MOTION}
        >
          <Check className="mt-0.5 size-4 opacity-95" strokeWidth={2.5} aria-hidden />
        </motion.span>
      </div>
    </motion.div>
  );

  const heroMockServiceRows = (
    <div className="flex min-h-[176px] flex-col justify-center gap-2">
      {heroMockPickRow({ primary: t("hero.mockService1"), selected: false })}
      {heroMockServiceTargetRow}
    </div>
  );

  const heroMockPaymentBlockEl = (
    <div className="flex min-h-[176px] flex-col justify-center gap-3">
      <div className="rounded-xl border border-blue-200/90 bg-blue-50/90 p-3.5 shadow-sm shadow-blue-900/5">
        <p className="text-sm font-semibold leading-snug text-blue-950">{t("hero.mockSelectedServiceLong")}</p>
        <div className="mt-3 flex items-center justify-between border-t border-blue-200/80 pt-3 text-sm font-bold text-blue-950">
          <span>{t("hero.mockPaymentTotal")}</span>
          <span className="text-blue-800">{t("hero.mockPaymentPrice")}</span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm">
        <CreditCard className="size-4 shrink-0 text-slate-500" strokeWidth={2} aria-hidden />
        <span className="min-w-0 truncate">{t("hero.mockPaymentCardStripe")}</span>
      </div>
      <div className="flex justify-end pt-0.5">
        <motion.div
          ref={paymentPayRef}
          className="rounded-xl border border-slate-200/90 px-5 py-2 text-xs font-bold shadow-sm"
          initial={
            prefersReducedMotion
              ? {
                  scale: 1,
                  backgroundColor: "rgb(37 99 235)",
                  color: "rgb(255 255 255)",
                  borderColor: "rgb(37 99 235)",
                  boxShadow: "0 10px 22px -8px rgb(37 99 235 / 0.45)",
                }
              : {
                  scale: 1,
                  backgroundColor: "rgb(255 255 255)",
                  color: "rgb(51 65 85)",
                  borderColor: "rgb(226 232 240)",
                  boxShadow: "0 1px 2px 0 rgb(15 23 42 / 0.04)",
                }
          }
          animate={
            prefersReducedMotion
              ? {
                  scale: 1,
                  backgroundColor: "rgb(37 99 235)",
                  color: "rgb(255 255 255)",
                  borderColor: "rgb(37 99 235)",
                  boxShadow: "0 10px 22px -8px rgb(37 99 235 / 0.45)",
                }
              : {
                  scale: [1, 1, 1.03, 1.05, 1.02, 1],
                  backgroundColor: [
                    "rgb(255 255 255)",
                    "rgb(248 250 252)",
                    "rgb(37 99 235)",
                    "rgb(37 99 235)",
                    "rgb(29 78 216)",
                    "rgb(37 99 235)",
                  ],
                  color: [
                    "rgb(51 65 85)",
                    "rgb(30 41 59)",
                    "rgb(255 255 255)",
                    "rgb(255 255 255)",
                    "rgb(255 255 255)",
                    "rgb(255 255 255)",
                  ],
                  borderColor: [
                    "rgb(226 232 240)",
                    "rgb(203 213 225)",
                    "rgb(37 99 235)",
                    "rgb(37 99 235)",
                    "rgb(29 78 216)",
                    "rgb(37 99 235)",
                  ],
                  boxShadow: [
                    "0 1px 2px 0 rgb(15 23 42 / 0.04)",
                    "0 2px 8px -2px rgb(15 23 42 / 0.08)",
                    "0 14px 28px -8px rgb(37 99 235 / 0.5)",
                    "0 10px 22px -6px rgb(79 70 229 / 0.35)",
                    "0 6px 16px -4px rgb(37 99 235 / 0.28)",
                    "0 10px 22px -8px rgb(37 99 235 / 0.38)",
                  ],
                }
          }
          transition={prefersReducedMotion ? { duration: 0 } : HERO_MOCK_TARGET_MOTION}
        >
          {t("hero.mockPayButton")}
        </motion.div>
      </div>
    </div>
  );

  const heroMockPlanRow = (p: { when: string; label: string; highlight: boolean }) => (
    <div
      className={`flex gap-2.5 rounded-xl border px-2.5 py-2 shadow-sm ${
        p.highlight ? "border-blue-200/90 bg-blue-50/90" : "border-slate-200/80 bg-white"
      }`}
    >
      <div
        className={`mt-0.5 w-1 shrink-0 self-stretch rounded-full ${p.highlight ? "bg-blue-600" : "bg-slate-300"}`}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold tracking-wide text-slate-500">{p.when}</p>
        <p className={`truncate text-xs font-semibold leading-snug ${p.highlight ? "text-blue-950" : "text-slate-800"}`}>
          {p.label}
        </p>
      </div>
    </div>
  );

  const heroMockWeekPlanning = (
    <div className="flex min-h-[176px] flex-col justify-center gap-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{t("hero.mockPlanListHint")}</p>
      {heroMockPlanRow({
        when: t("hero.mockPlanRow1When"),
        label: t("hero.mockPlanRow1Label"),
        highlight: false,
      })}
      {heroMockPlanRow({
        when: t("hero.mockPlanRow2When"),
        label: t("hero.mockPlanRow2Label"),
        highlight: false,
      })}
      {heroMockPlanRow({
        when: t("hero.mockPlanRow3When"),
        label: t("hero.mockPlanRow3Label"),
        highlight: true,
      })}
    </div>
  );

  const heroMockDashboardMini = (
    <div className="flex min-h-[176px] flex-col justify-center gap-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-slate-200/90 bg-white p-2 shadow-sm">
          <div className="h-1.5 w-7 rounded-full bg-slate-200" aria-hidden />
          <p className="mt-2 text-lg font-bold tabular-nums text-slate-900">12</p>
          <p className="text-[10px] font-medium text-slate-500">{t("hero.mockDashboardKpi1")}</p>
        </div>
        <div className="rounded-lg border border-slate-200/90 bg-white p-2 shadow-sm">
          <div className="h-1.5 w-8 rounded-full bg-slate-200" aria-hidden />
          <p className="mt-2 text-lg font-bold tabular-nums text-blue-700">{t("hero.mockDashboardRevenueValue")}</p>
          <p className="text-[10px] font-medium text-slate-500">{t("hero.mockDashboardKpi2")}</p>
        </div>
        <div className="rounded-lg border border-slate-200/90 bg-white p-2 shadow-sm">
          <div className="h-1.5 w-6 rounded-full bg-slate-200" aria-hidden />
          <p className="mt-2 text-lg font-bold tabular-nums text-emerald-700">94%</p>
          <p className="text-[10px] font-medium text-slate-500">{t("hero.mockDashboardKpi3")}</p>
        </div>
      </div>
      <div className="flex h-[76px] items-end gap-1 rounded-xl border border-slate-200/90 bg-slate-50/90 px-2 pb-2 pt-3">
        {[28, 48, 36, 64, 40, 52, 44].map((h, i) => (
          <div
            key={i}
            style={{ height: `${h}px` }}
            className="min-h-0 flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 shadow-sm"
            aria-hidden
          />
        ))}
      </div>
    </div>
  );

  const slideDots = (
    <div className="flex justify-center gap-1.5 pt-2" aria-hidden>
      {Array.from({ length: HERO_MOCK_SLIDE_COUNT }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            activeSlide === i ? "w-5 bg-blue-600" : "w-1.5 bg-slate-300"
          }`}
        />
      ))}
    </div>
  );

  const slideHeader = (p: { eyebrow: string; title: string; icon: ReactNode; titleClassName?: string }) => {
    const ring = "from-blue-500 to-indigo-600 shadow-blue-600/25";
    const iconBubble = (
      <div className={`shrink-0 rounded-full bg-gradient-to-br p-2.5 text-white shadow-lg ${ring}`}>{p.icon}</div>
    );
    const titleClass = p.titleClassName ?? "text-lg";
    return (
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">{p.eyebrow}</p>
          <p className={`mt-1 font-semibold text-slate-900 ${titleClass}`}>{p.title}</p>
        </div>
        {iconBubble}
      </div>
    );
  };

  const slideScheduleBody = (
    <>
      {slideHeader({
        eyebrow: t("hero.mockScheduleEyebrow"),
        title: t("hero.mockScheduleTitle"),
        icon: <CalendarDays className="size-5" />,
      })}
      {heroMockWeekPlanning}
    </>
  );

  const slideDashboardBody = (
    <>
      {slideHeader({
        eyebrow: t("hero.mockDashboardEyebrow"),
        title: t("hero.mockDashboardTitle"),
        titleClassName: "text-base leading-snug sm:text-lg",
        icon: <LayoutDashboard className="size-5" />,
      })}
      {heroMockDashboardMini}
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-lg lg:mx-0"
    >
      <div
        className="rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-2xl shadow-blue-900/10 ring-1 ring-slate-900/5 backdrop-blur-sm"
        aria-label={t("hero.mockAriaFlow")}
      >
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <span className="size-2.5 rounded-full bg-red-400/90" />
          <span className="size-2.5 rounded-full bg-amber-400/90" />
          <span className="size-2.5 rounded-full bg-emerald-400/90" />
          <div className="ml-3 flex-1 truncate rounded-lg bg-slate-100 px-3 py-1.5 text-center font-mono text-[11px] text-slate-600 sm:text-xs">
            {t("hero.urlHint")}
          </div>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <AnimatePresence initial={false} mode="wait">
            {activeSlide === 0 ? (
              <motion.div
                key="hero-mock-calendar"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                <div ref={calendarContainerRef} className="relative space-y-4 overflow-visible">
                  {!prefersReducedMotion ? (
                    <HeroMockCursor containerRef={calendarContainerRef} targetRef={calendarTargetRef} />
                  ) : null}
                  {slideHeader({
                    eyebrow: t("hero.mockDateEyebrow"),
                    title: t("hero.mockDateTitle"),
                    icon: <CalendarCheck className="size-5" />,
                  })}
                  {heroMockCalendarGridEl}
                </div>
              </motion.div>
            ) : null}
            {activeSlide === 1 ? (
              <motion.div
                key="hero-mock-booking"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                <div ref={serviceContainerRef} className="relative space-y-4 overflow-visible">
                  {!prefersReducedMotion ? (
                    <HeroMockCursor containerRef={serviceContainerRef} targetRef={serviceTargetRef} />
                  ) : null}
                  {slideHeader({
                    eyebrow: t("hero.mockServiceEyebrow"),
                    title: t("hero.mockServiceTitle"),
                    icon: <ListChecks className="size-5" />,
                  })}
                  {heroMockServiceRows}
                </div>
              </motion.div>
            ) : null}
            {activeSlide === 2 ? (
              <motion.div
                key="hero-mock-payment"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                <div ref={paymentContainerRef} className="relative space-y-4 overflow-visible">
                  {!prefersReducedMotion ? (
                    <HeroMockCursor containerRef={paymentContainerRef} targetRef={paymentPayRef} />
                  ) : null}
                  {slideHeader({
                    eyebrow: t("hero.mockPaymentEyebrow"),
                    title: t("hero.mockPaymentSubtitle"),
                    titleClassName: "text-base leading-snug sm:text-lg",
                    icon: <CreditCard className="size-5" />,
                  })}
                  {heroMockPaymentBlockEl}
                </div>
              </motion.div>
            ) : null}
            {activeSlide === 3 ? (
              <motion.div
                key="hero-mock-schedule"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                {slideScheduleBody}
              </motion.div>
            ) : null}
            {activeSlide === 4 ? (
              <motion.div
                key="hero-mock-dashboard"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                {slideDashboardBody}
              </motion.div>
            ) : null}
          </AnimatePresence>
          {slideDots}
        </div>
      </div>
    </motion.div>
  );
}

export default function Page() {
  const t = useTranslations("public.landing");
  const { data: sessionPayload } = useSession();
  const user = sessionPayload?.user ?? null;

  const signInButton = (
    <Button variant="ghost" size="sm" className="inline-flex rounded-xl text-slate-600" asChild>
      <Link href="/admin/signin">
        {user ? (
          <span className="inline-flex items-center gap-2">
            <Avatar className="size-5 border border-slate-200">
              {user.image ? <AvatarImage src={user.image} alt={user.name ?? ""} className="object-cover" /> : null}
              <AvatarFallback className="bg-slate-100 text-[10px] font-semibold text-slate-700">
                {initialsFromName(user.name ?? "")}
              </AvatarFallback>
            </Avatar>
            <span>{t("nav.adminAccess")}</span>
          </span>
        ) : (
          t("nav.signIn")
        )}
      </Link>
    </Button>
  );

  const navBar = (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-slate-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <BookidoLogo className="h-5 w-5 brightness-0 invert" />
          </div>
          <span className="text-lg font-bold tracking-tight">Bookido</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 md:flex md:gap-6">
          <a href="#how-it-works" className="transition-colors hover:text-slate-900">
            {t("nav.howItWorks")}
          </a>
          <a href="#pricing" className="transition-colors hover:text-slate-900">
            {t("nav.pricing")}
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {signInButton}
          <Button size="sm" className="rounded-xl shadow-sm" asChild>
            <Link href="/admin/signup">
              {t("nav.try")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );

  const heroBackground = (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-400/25 blur-3xl" />
      <div className="absolute top-40 -right-24 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="absolute bottom-0 -left-16 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );

  const heroCopy = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-xl text-center lg:text-left"
    >
      <Badge variant="secondary" className="mb-6 rounded-full border border-blue-200/80 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
        <Sparkles className="mr-1.5 size-3" aria-hidden />
        {t("hero.badge")}
      </Badge>
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.05]">
        {t("hero.titleBefore")}{" "}
        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{t("hero.titleAccent")}</span>
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">{t("hero.subtitle")}</p>
      <div className="mt-10 flex justify-center lg:justify-start">
        <Button size="default" className="h-12 rounded-xl px-8 text-base shadow-lg shadow-blue-600/25" asChild>
          <a href="#pricing">
            {t("hero.ctaScroll")}
            <ArrowRight className="size-4" />
          </a>
        </Button>
      </div>
    </motion.div>
  );

  const heroSection = (
    <section className="relative pt-28 pb-20 sm:pt-32 sm:pb-28 lg:pt-36 lg:pb-32">
      {heroBackground}
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-16 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        {heroCopy}
        <LandingHeroBrowserMock />
      </div>
    </section>
  );

  const pillarVisualCard = (p: {
    title: string;
    body: string;
    icon: ReactNode;
    accent: "blue" | "violet" | "cyan";
    delay: number;
  }) => {
    const accentRing =
      p.accent === "blue"
        ? "from-blue-500 to-indigo-600 shadow-blue-600/25"
        : p.accent === "violet"
          ? "from-violet-500 to-purple-600 shadow-violet-600/25"
          : "from-cyan-500 to-teal-600 shadow-teal-600/20";
    const blobTint =
      p.accent === "blue" ? "bg-blue-400/15" : p.accent === "violet" ? "bg-violet-400/15" : "bg-teal-400/15";

    const iconWrap = (
      <div
        className={`relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${accentRing}`}
      >
        {p.icon}
        <span className={`pointer-events-none absolute -right-1 -bottom-1 size-10 rounded-full blur-xl ${blobTint}`} aria-hidden />
      </div>
    );

    const textBlock = (
      <div className="min-w-0">
        <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{p.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{p.body}</p>
      </div>
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, delay: p.delay }}
        className="group relative h-full"
      >
        <div
          className={`pointer-events-none absolute -inset-px rounded-2xl opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100 ${
            p.accent === "blue"
              ? "bg-gradient-to-br from-blue-500/40 to-indigo-500/30"
              : p.accent === "violet"
                ? "bg-gradient-to-br from-violet-500/35 to-purple-500/25"
                : "bg-gradient-to-br from-teal-500/35 to-cyan-500/25"
          }`}
          aria-hidden
        />
        <Card className="relative h-full overflow-hidden border-slate-200/90 bg-white/90 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl">
          <CardContent className="flex h-full flex-col gap-5 p-7 sm:flex-row sm:items-start sm:gap-6 sm:p-8">
            {iconWrap}
            {textBlock}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const pillarsSectionHeader = (
    <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
      <h2
        id="how-it-works"
        className="scroll-mt-28 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
      >
        {t("pillars.heading")}
      </h2>
    </div>
  );

  const pillarsGrid = (
    <div className="mx-auto mt-12 grid max-w-6xl gap-8 px-4 sm:grid-cols-3 sm:gap-6 sm:px-6">
      {pillarVisualCard({
          title: t("pillars.one.title"),
          body: t("pillars.one.body"),
          icon: <Link2 className="size-7" strokeWidth={2} />,
          accent: "blue",
          delay: 0,
        })}
        {pillarVisualCard({
          title: t("pillars.two.title"),
          body: t("pillars.two.body"),
          icon: <Banknote className="size-7" strokeWidth={2} />,
          accent: "violet",
          delay: 0.1,
        })}
        {pillarVisualCard({
          title: t("pillars.three.title"),
          body: t("pillars.three.body"),
          icon: <ListChecks className="size-7" strokeWidth={2} />,
          accent: "cyan",
          delay: 0.2,
        })}
    </div>
  );

  const pillarsSection = (
    <section className="border-y border-slate-200/80 bg-linear-to-b from-slate-50 via-white to-slate-50/90 py-20 backdrop-blur-sm sm:py-24">
      {pillarsSectionHeader}
      {pillarsGrid}
    </section>
  );

  const pricingBullet = (text: string) => (
    <li className="flex gap-2.5 text-sm leading-snug text-slate-600">
      <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
      <span>{text}</span>
    </li>
  );

  const pricingStarterCard = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45 }}
    >
      <Card className="h-full border-slate-200/90 bg-white shadow-md">
        <CardContent className="flex h-full flex-col p-8">
          <p className="text-sm font-semibold text-slate-500">{t("pricing.starter.name")}</p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-slate-900">{t("pricing.starter.price")}</span>
            <span className="text-sm text-slate-500">{t("pricing.starter.per")}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">{t("pricing.starter.desc")}</p>
          <ul className="mt-6 flex flex-1 flex-col gap-3">
            {pricingBullet(t("pricing.starter.f1"))}
            {pricingBullet(t("pricing.starter.f2"))}
            {pricingBullet(t("pricing.starter.f3"))}
          </ul>
          <Button variant="outline" className="mt-8 w-full rounded-xl border-slate-300" asChild>
            <Link href="/admin/signup">{t("nav.try")}</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  const pricingProCard = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: 0.08 }}
    >
      <Card className="relative h-full overflow-hidden border-2 border-blue-600 bg-linear-to-b from-blue-50/80 to-white shadow-xl shadow-blue-900/10">
        <div className="absolute right-4 top-4">
          <Badge className="rounded-full border-0 bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white hover:bg-blue-600">
            {t("pricing.pro.badge")}
          </Badge>
        </div>
        <CardContent className="flex h-full flex-col p-8 pt-14">
          <p className="text-sm font-semibold text-blue-800">{t("pricing.pro.name")}</p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-slate-900">{t("pricing.pro.price")}</span>
            <span className="text-sm text-slate-500">{t("pricing.pro.per")}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">{t("pricing.pro.desc")}</p>
          <ul className="mt-6 flex flex-1 flex-col gap-3">
            {pricingBullet(t("pricing.pro.f1"))}
            {pricingBullet(t("pricing.pro.f2"))}
            {pricingBullet(t("pricing.pro.f3"))}
            {pricingBullet(t("pricing.pro.f4"))}
          </ul>
          <Button className="mt-8 w-full rounded-xl shadow-md shadow-blue-600/20" asChild>
            <Link href="/admin/signup">{t("nav.try")}</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  const pricingSectionHeader = (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">{t("pricing.eyebrow")}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {t("pricing.title")}
      </h2>
      <p className="mt-4 text-lg text-slate-600">{t("pricing.subtitle")}</p>
    </div>
  );

  const pricingSection = (
    <section id="pricing" className="scroll-mt-28 border-t border-slate-200/80 bg-slate-50/50 py-20 sm:py-24">
      {pricingSectionHeader}
      <div className="mx-auto mt-14 grid max-w-4xl gap-8 px-4 sm:px-6 md:grid-cols-2 md:items-stretch md:gap-6">
        {pricingStarterCard}
        {pricingProCard}
      </div>
    </section>
  );

  const ctaBand = (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-8 py-14 text-center shadow-2xl shadow-blue-900/30 sm:px-12"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
          <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">{t("ctaBand.title")}</h2>
          <p className="relative mx-auto mt-4 max-w-2xl text-lg text-blue-100">{t("ctaBand.subtitle")}</p>
          <div className="relative mt-10">
            <Button
              size="default"
              variant="secondary"
              className="h-12 rounded-xl border-0 bg-white px-8 text-base font-semibold text-blue-700 shadow-lg hover:bg-blue-50"
              asChild
            >
              <Link href="/admin/signin">
                {t("ctaBand.button")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );

  const footerBlock = (
    <footer className="border-t border-slate-200 bg-slate-50 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
        <div className="flex items-center gap-2.5">
          <BookidoLogo className="h-8 w-8 text-blue-600" />
          <div>
            <p className="font-semibold text-slate-900">Bookido</p>
            <p className="text-sm text-slate-500">{t("footer.tagline")}</p>
          </div>
        </div>
        <p className="text-sm text-slate-500">{t("footer.rights")}</p>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {navBar}
      <main>
        {heroSection}
        {pillarsSection}
        {pricingSection}
        {ctaBand}
      </main>
      {footerBlock}
    </div>
  );
}
