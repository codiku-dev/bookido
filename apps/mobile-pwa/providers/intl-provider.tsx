"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/i18n/en.json";
import fr from "@/i18n/fr.json";

const messagesByLocale = { en, fr } as const;
export type AppLocale = keyof typeof messagesByLocale;

type IntlCtx = {
  locale: AppLocale;
  setLocale: (l: AppLocale) => void;
};

const Ctx = createContext<IntlCtx | null>(null);

export function useAppLocale(): IntlCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppLocale must be used under IntlProvider");
  return v;
}

export function IntlProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("en");

  useEffect(() => {
    const raw = localStorage.getItem("locale");
    if (raw === "fr" || raw === "en") setLocaleState(raw);
  }, []);

  const setLocale = useCallback((l: AppLocale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    document.documentElement.lang = l;
  }, []);

  const messages = useMemo(() => messagesByLocale[locale], [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <Ctx.Provider value={value}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        onError={(err) => {
          if (
            err instanceof Error &&
            "code" in err &&
            (err as { code?: string }).code === "ENVIRONMENT_FALLBACK"
          ) {
            return;
          }
          console.error(err);
        }}
      >
        {children}
      </NextIntlClientProvider>
    </Ctx.Provider>
  );
}
