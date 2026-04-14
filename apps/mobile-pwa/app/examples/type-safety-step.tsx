"use client";

import { useTranslations } from "next-intl";
import { trpc } from "@mobile/libs/trpc-client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button/button";
import { SimpleCodeCard } from "@/app/examples/components/simple-code-card";

export function TypeSafetyStep() {
  const t = useTranslations("Landing.step1");
  const { data, isLoading, refetch } = trpc.app.hello.useQuery(undefined, {
    enabled: false,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <SimpleCodeCard
          title="apps/api/src/features/users/users.router.ts"
          badge={<Badge>{t("backendSide")}</Badge>}
        >
          <span className="text-violet-400">@Router</span>
          <span className="text-zinc-300">( alias: </span>
          <span className="text-emerald-400">&apos;users&apos;</span>
          <span className="text-zinc-300"> )</span>
          {"\n"}
          <span className="text-violet-400">export class</span>{" "}
          <span className="text-amber-400">UserRouter</span>{" "}
          <span className="text-zinc-300">{"{"}</span>
          {"\n  "}
          <span className="text-violet-400">@Query</span>
          <span className="text-zinc-300">(...) readAll() {"{ ... }"}</span>
          {"\n"}
          <span className="text-zinc-300">{"}"}</span>
        </SimpleCodeCard>

        <SimpleCodeCard
          title="apps/mobile/app/page.tsx"
          badge={<Badge>{t("frontendSide")}</Badge>}
        >
          <span className="text-zinc-500">&apos;use client&apos;</span>
          <span className="text-zinc-300">;</span>
          {"\n"}
          <span className="text-zinc-500">import</span>{" "}
          <span className="text-sky-400">{"{ trpc }"}</span>{" "}
          <span className="text-zinc-500">from</span>{" "}
          <span className="text-emerald-400">&apos;@mobile/libs/trpc-client&apos;</span>
          <span className="text-zinc-300">;</span>
          {"\n\n"}
          <span className="text-violet-400">const</span>{" "}
          <span className="text-sky-400">{"{ data }"}</span> = trpc.app.hello.useQuery();
        </SimpleCodeCard>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
        <p className="text-xs text-zinc-400 mb-3">
          <Badge>{t("result")}</Badge>
        </p>
        <Button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className="mb-3"
        >
          {isLoading ? "Loading..." : "Fetch data"}
        </Button>
        {isLoading ? (
          <p className="text-sm text-zinc-400">Loading...</p>
        ) : data ? (
          <pre className="text-xs font-mono bg-zinc-950 text-zinc-100 p-3 rounded border border-zinc-800 overflow-x-auto">
            <code>{JSON.stringify(data, null, 2)}</code>
          </pre>
        ) : (
          <p className="text-sm text-zinc-400">Click the button to fetch data</p>
        )}
      </div>
    </div>
  );
}
