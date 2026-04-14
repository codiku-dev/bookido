"use client";

import { useTranslations } from "next-intl";

export function AutoDocStep() {
  const t = useTranslations("Landing.step7");
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const docsUrl = base ? `${base.replace(/\/$/, "")}/docs` : "#";

  return (
    <div className="space-y-4">
      <a
        href={docsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        {t("openDocs")}
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
      {!base ? (
        <p className="text-xs text-amber-400/90">
          Set NEXT_PUBLIC_API_BASE_URL in .env.local.development to enable the docs link.
        </p>
      ) : null}

    </div>
  );
}
