"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@repo/ui/components/badge";
import { cn } from "@/utils/css-utils";
import { SimpleCodeCard } from "@/app/examples/components/simple-code-card";
import { useAppLocale } from "@/providers/intl-provider";

export function InternationalizationStep() {
  const t = useTranslations("Landing.step5");
  const tEx = useTranslations("I18nExample");
  const { locale, setLocale } = useAppLocale();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SimpleCodeCard
        title="apps/mobile/.../my-component.tsx"
        badge={<Badge>{t("code")}</Badge>}
      >
        <span className="text-zinc-500">&apos;use client&apos;</span>
        <span className="text-zinc-300">;</span>
        {"\n"}
        <span className="text-zinc-500">import</span>{" "}
        <span className="text-sky-400">{"{ useTranslations }"}</span>{" "}
        <span className="text-zinc-500">from</span>{" "}
        <span className="text-emerald-400">&apos;next-intl&apos;</span>
        <span className="text-zinc-300">;</span>
        {"\n\n"}
        <span className="text-violet-400">const</span> t = useTranslations(
        <span className="text-emerald-400">&apos;I18nExample&apos;</span>);
      </SimpleCodeCard>

      <div
        className="rounded-xl border border-white/10 bg-white text-zinc-900 p-4 flex flex-col"
        data-testid="intl-demo"
      >
        <div className="flex flex-wrap gap-2 justify-end mb-4">
          {(
            [
              { code: "en" as const, label: "English" },
              { code: "fr" as const, label: "Français" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => setLocale(opt.code)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                locale === opt.code
                  ? "bg-violet-600 text-white border-violet-500"
                  : "bg-zinc-100 text-zinc-800 border-zinc-200 hover:bg-zinc-200",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mb-2">{t("result")}</p>
        <h2 className="text-lg font-semibold mb-1">{tEx("title")}</h2>
        <p className="text-sm text-zinc-600">{tEx("description")}</p>
        <p className="text-xs text-zinc-400 mt-3">
          Locale is stored in <code className="bg-zinc-100 px-1 rounded">localStorage</code>{" "}
          (client-only, no SSR).
        </p>
      </div>
    </div>
  );
}
