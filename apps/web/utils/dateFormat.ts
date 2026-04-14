import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

export type Locale = 'fr' | 'en';

const locales = {
  fr: fr,
  en: enUS,
};

export function formatDate(date: Date | string, formatStr: string, locale: Locale = 'fr'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: locales[locale] });
}

// Formats communs
export function formatShortDate(date: Date | string, locale: Locale = 'fr'): string {
  return formatDate(date, 'd MMM yyyy', locale);
}

export function formatLongDate(date: Date | string, locale: Locale = 'fr'): string {
  return formatDate(date, 'EEEE d MMMM yyyy', locale);
}

export function formatMonthYear(date: Date | string, locale: Locale = 'fr'): string {
  return formatDate(date, 'MMMM yyyy', locale);
}

export function formatDayMonth(date: Date | string, locale: Locale = 'fr'): string {
  return formatDate(date, 'd MMM', locale);
}
