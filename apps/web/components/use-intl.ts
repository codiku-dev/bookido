"use client";

import { useLocale, useTranslations } from "next-intl";

type MessageValues = Record<string, string | number>;
type MessageDescriptor = { id: string };

export const useIntl = () => {
  const locale = useLocale();
  const t = useTranslations();

  const formatMessage = (descriptor: MessageDescriptor, values?: MessageValues) => {
    if (!t.has(descriptor.id)) {
      return descriptor.id;
    }
    return t(descriptor.id, values);
  };

  return { locale, formatMessage };
};
