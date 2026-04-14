import { NextIntlClientProvider } from 'next-intl';

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
    return <NextIntlClientProvider >{children}</ NextIntlClientProvider>;
};