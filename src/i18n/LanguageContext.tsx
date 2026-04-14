import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { IntlProvider } from "react-intl";
import { fr } from "./locales/fr";
import { en } from "./locales/en";

type Locale = "fr" | "en";

const messages: Record<Locale, Record<string, string>> = {
  fr,
  en,
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("bookido-language");
    return (saved as Locale) || "fr";
  });

  useEffect(() => {
    localStorage.setItem("bookido-language", locale);
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <IntlProvider locale={locale} messages={messages[locale]} defaultLocale="fr">
        {children}
      </IntlProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
