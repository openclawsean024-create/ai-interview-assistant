'use client';

import { useLocale } from '@/app/i18n/locale-context';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div className={`flex items-center rounded-lg bg-zinc-800/60 border border-zinc-700/50 p-0.5 ${className}`}>
      <button
        onClick={() => setLocale('zh')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
          locale === 'zh'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        中文
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
          locale === 'en'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        EN
      </button>
    </div>
  );
}
