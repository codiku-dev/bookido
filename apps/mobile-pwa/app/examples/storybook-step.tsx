"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@repo/ui/components/badge";
import { SimpleCodeCard } from "@/app/examples/components/simple-code-card";

export function StorybookStep() {
  const t = useTranslations("Landing.step3");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SimpleCodeCard
        title="packages/ui/src/button/button.stories.tsx"
        badge={<Badge>{t("uiPackageSide")}</Badge>}
      >
        <span className="text-zinc-500">import type</span>{" "}
        <span className="text-sky-400">{"{ Meta, StoryObj }"}</span>{" "}
        <span className="text-zinc-500">from</span>{" "}
        <span className="text-emerald-400">&apos;@storybook/react&apos;</span>
        <span className="text-zinc-300">;</span>
        {"\n"}
        <span className="text-violet-400">const</span> meta = {"{"} title:{" "}
        <span className="text-emerald-400">&apos;UI/Button&apos;</span> {"}"};
      </SimpleCodeCard>

      <div className="rounded-xl border border-dashed border-zinc-600 bg-zinc-900/40 min-h-[160px] flex items-center justify-center p-4">
        <p className="text-sm text-zinc-500 text-center">
          {t("result")}: run{" "}
          <code className="text-violet-300">bun run storybook</code> at the repo root
          to open Storybook (same as web).
        </p>
      </div>
    </div>
  );
}
