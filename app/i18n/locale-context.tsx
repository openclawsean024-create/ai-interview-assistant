'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Locale } from './translations';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof translations.zh | typeof translations.en;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'zh',
  setLocale: () => {},
  t: translations.zh,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh');

  useEffect(() => {
    const stored = localStorage.getItem('ai_interview_locale') as Locale;
    if (stored === 'zh' || stored === 'en') {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('ai_interview_locale', newLocale);
  };

  const t = translations[locale];

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
