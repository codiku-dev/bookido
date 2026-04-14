"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@repo/ui/components/badge";
import { SimpleCodeCard } from "@/app/examples/components/simple-code-card";

export function EnvStep() {
  const t4 = useTranslations("Landing.step4");
  const t10 = useTranslations("Landing.step10");

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-200">
            {t4("stronglyTypeEnv")}
          </h3>
          <SimpleCodeCard
            title="apps/api/env-type.ts"
            badge={<Badge>{t4("zodSchemaBadge")}</Badge>}
          >
            <span className="text-violet-400">import</span>{" "}
            <span className="text-sky-400">{"{ z }"}</span>{" "}
            <span className="text-violet-400">from</span>{" "}
            <span className="text-emerald-400">&apos;zod&apos;</span>
            <span className="text-zinc-300">;</span>
            {"\n\n"}
            <span className="text-violet-400">export const</span> envSchema = z.object(
            {"{"}
            {"\n  "}
            DATABASE_URL: z.string(),{"\n  "}
            AUTH_SECRET: z.string(),{"\n"}
            {"}"});
          </SimpleCodeCard>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-200">{t4("typedEnv")}</h3>
          <SimpleCodeCard>
            <span className="text-zinc-500">
              {"// "}
              {t4("typedVarLabel")}
            </span>
            {"\n"}
            <span className="text-violet-400">const</span> dbUrl = process.env.
            <span className="text-amber-400">DATABASE_URL</span>;
          </SimpleCodeCard>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">
          {t4("validationTitle")}
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <SimpleCodeCard title=".env" badge={<Badge>{t4("envFile")}</Badge>}>
            PATABASE_URL=postgresql://...{"\n"}PORT=3090{"\n"}
            <span className="text-rose-400"># missing AUTH_SECRET</span>
          </SimpleCodeCard>
          <SimpleCodeCard title={t4("terminal")}>
            <span className="text-rose-400">❌ apps/api: Missing env: AUTH_SECRET</span>
          </SimpleCodeCard>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-200">
          {t4("encryptedEnvTitle")}
        </h3>
        <p className="text-sm text-zinc-400">{t10("intro")}</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <SimpleCodeCard
            title=".env.production"
            badge={<Badge>{t10("encryptedBadge")}</Badge>}
          >
            <span className="text-zinc-500"># dotenvx — {t10("encryptedComment")}</span>
            {"\n"}
            DATABASE_URL=
            <span className="text-amber-400">encrypted:BK6Rja5JUUxXIIUcPtx...</span>
          </SimpleCodeCard>
          <div className="flex flex-col gap-2">
            <SimpleCodeCard
              title=".env.keys"
              badge={
                <Badge className="border-red-500/40 bg-red-500/20 text-red-200">
                  {t10("privateBadge")}
                </Badge>
              }
            >
              <span className="text-zinc-500"># {t10("keysComment")}</span>
              {"\n\n"}
              DOTENV_PRIVATE_KEY_PRODUCTION=...
            </SimpleCodeCard>
            <p className="text-xs text-zinc-500">{t10("ciHint")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
