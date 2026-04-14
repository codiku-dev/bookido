"use client";

import { useLocale } from "next-intl";

type Locale = "fr" | "en";

export const useLanguage = () => {
  const locale = useLocale() as Locale;

  const setLocale = (nextLocale: Locale) => {
    document.cookie = `locale=${nextLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return { locale, setLocale };
};
