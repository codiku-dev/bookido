"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@repo/ui/components/badge";
import { SimpleCodeCard } from "@/app/examples/components/simple-code-card";
import reactEmailExampleImg from "@/app/examples/assets/react-email-example.png";

export function CleanEmailsStep() {
  const t = useTranslations("Landing.step11");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <SimpleCodeCard
          title="packages/emails/src/YourEmail.tsx"
          badge={<Badge size="sm">{t("reactEmailBadge")}</Badge>}
        >
          <span className="text-violet-400">export default function</span> Email(p: {"{"}{" "}
          locale: string {"}"}) {"{"}
          {"\n  "}
          return &lt;Tailwind&gt;...&lt;/Tailwind&gt;;
          {"\n"}
          {"}"}
        </SimpleCodeCard>
        <div className="rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950/50 shadow-lg">
          <Image
            src={reactEmailExampleImg}
            alt={t("screenshotAlt")}
            width={1200}
            height={800}
            className="w-full h-auto"
            priority
          />
          <div className="border-t border-zinc-700 bg-zinc-900/40 p-4">
            <p className="text-sm leading-relaxed text-zinc-300">{t("explanation")}</p>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">{t("tailwindIntlHint")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
