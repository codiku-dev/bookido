"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@repo/ui/components/badge";
import { SimpleCodeCard } from "@/app/examples/components/simple-code-card";

export function LoggingStep() {
  const t = useTranslations("Landing.step9");

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Use{" "}
        <code className="text-violet-300 bg-zinc-900 px-1 rounded">AuthGuardRouter</code>{" "}
        with <code className="text-violet-300 bg-zinc-900 px-1 rounded">logs: true</code>{" "}
        on the API to print structured request logs (URL, meta, response) in the server
        terminal — same behavior as on web.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <SimpleCodeCard
          title="apps/api/.../users.router.ts"
          badge={<Badge>{t("codeLabel")}</Badge>}
        >
          <span className="text-violet-400">@AuthGuard</span>
          <span className="text-zinc-300">(</span>
          <span className="text-zinc-300">{"{ "}</span>
          <span className="text-sky-400">alias:</span>
          <span className="text-zinc-300"> </span>
          <span className="text-emerald-400">&apos;users&apos;</span>
          <span className="text-zinc-300">, </span>
          <span className="text-sky-400">logs:</span>
          <span className="text-zinc-300"> </span>
          <span className="text-amber-400">true</span>
          <span className="text-zinc-300">{" }"}</span>
          <span className="text-zinc-300">)</span>
        </SimpleCodeCard>
        <SimpleCodeCard title="api:dev" badge={<Badge>{t("terminalLabel")}</Badge>}>
          <span className="text-zinc-400">URL</span>
          {"\n"}
          <span className="text-cyan-300">.../trpc/users.read</span>
          {"\n\n"}
          <span className="text-zinc-400">META</span>
          {"\n"}
          <span className="text-zinc-300">path · type · duration</span>
          {"\n\n"}
          <span className="text-rose-400">RESPONSE (error example)</span>
          {"\n"}
          <span className="text-zinc-300">{"{ \"message\": \"...\" }"}</span>
        </SimpleCodeCard>
      </div>
    </div>
  );
}
