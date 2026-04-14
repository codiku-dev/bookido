"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button/button";
import { SimpleCodeCard } from "@/app/examples/components/simple-code-card";

export function ShareResourcesStep() {
  const t = useTranslations("Landing.step2");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <SimpleCodeCard
          title="packages/ui/src/button/button.tsx"
          badge={<Badge>{t("uiPackageSide")}</Badge>}
        >
          <span className="text-violet-400">export function</span>{" "}
          <span className="text-amber-400">Button</span>
          <span className="text-zinc-300">() {"{"}</span>
          {"\n  "}
          <span className="text-violet-400">return</span> &lt;button&gt;...&lt;/button&gt;;
          {"\n"}
          <span className="text-zinc-300">{"}"}</span>
        </SimpleCodeCard>

        <SimpleCodeCard
          title="apps/mobile/app/examples/..."
          badge={<Badge>{t("nextjsSide")}</Badge>}
        >
          <span className="text-zinc-500">import</span>{" "}
          <span className="text-sky-400">{"{ Button }"}</span>{" "}
          <span className="text-zinc-500">from</span>{" "}
          <span className="text-emerald-400">&apos;@repo/ui/components/button/button&apos;</span>
        </SimpleCodeCard>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
        <p className="text-xs text-zinc-400 mb-3">{t("resultLabel")}</p>
        <Button type="button">{t("buttonLabel")}</Button>
      </div>
    </div>
  );
}
