import { useState, useCallback, useMemo, useEffect } from 'react';
import { dict, type Lang } from './dict';

const STORAGE_KEY = 'dedup-studio-lang';
const SUPPORTED: Lang[] = ['ru', 'en', 'de'];

function normalizeLang(code: string | undefined | null): Lang | null {
  if (!code) return null;
  const base = code.toLowerCase().split('-')[0];
  if (base === 'ru' || base === 'be' || base === 'uk' || base === 'kk') return 'ru';
  if (base === 'de' || base === 'at' || base === 'ch') return 'de';
  if (base === 'en') return 'en';
  // es, fr, it, pt, pl, tr, zh, ja, ... → English fallback
  return null;
}

function detectBrowserLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch {
    // ignore
  }

  const candidates: string[] = [];
  if (typeof navigator !== 'undefined') {
    if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
    if (navigator.language) candidates.push(navigator.language);
  }

  for (const c of candidates) {
    const mapped = normalizeLang(c);
    if (mapped) return mapped;
  }

  // Spanish, French, and any unsupported locale → English
  return 'en';
}

export function useI18n() {
  const [lang, setLangState] = useState<Lang>(() => detectBrowserLang());

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let s = dict[lang][key] ?? dict.en[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return s;
    },
    [lang]
  );

  const languages = useMemo(
    () => [
      { code: 'ru' as Lang, label: 'Русский' },
      { code: 'en' as Lang, label: 'English' },
      { code: 'de' as Lang, label: 'Deutsch' },
    ],
    []
  );

  return { lang, setLang, t, languages };
}
