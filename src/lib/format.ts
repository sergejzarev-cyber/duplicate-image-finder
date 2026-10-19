import type { Lang } from "../types";

export const LOCALES: Record<Lang, string> = {
  ru: "ru-RU",
  de: "de-DE",
  en: "en-US",
};

const BYTE_UNITS: Record<Lang, string[]> = {
  ru: ["Б", "КБ", "МБ", "ГБ", "ТБ"],
  de: ["B", "KB", "MB", "GB", "TB"],
  en: ["B", "KB", "MB", "GB", "TB"],
};

export function formatBytes(bytes: number, lang: Lang): string {
  const units = BYTE_UNITS[lang];
  if (!Number.isFinite(bytes) || bytes < 0) return `0 ${units[0]}`;
  let v = bytes;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  const nf = new Intl.NumberFormat(LOCALES[lang], {
    maximumFractionDigits: v >= 100 || u === 0 ? 0 : 1,
  });
  return `${nf.format(v)} ${units[u]}`;
}

export function formatDate(ts: number, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ts));
}

export function formatInt(n: number, lang: Lang): string {
  return new Intl.NumberFormat(LOCALES[lang]).format(n);
}
