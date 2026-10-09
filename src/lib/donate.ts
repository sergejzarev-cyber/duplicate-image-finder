/**
 * Донат через PayPal (или любой другой сервис по ссылке).
 * Приоритет:
 *  1. VITE_DONATE_URL из окружения (Vercel Dashboard / .env) — можно сменить без кода
 *  2. DEFAULT_DONATE_URL ниже — ваша постоянная ссылка, работает из коробки
 * Поддерживаются два формата:
 *  - PayPal.Me: https://paypal.me/username — сумму допишем сами (/5EUR)
 *  - Готовая кнопка PayPal / Ko-fi / BuyMeACoffee — откроем как есть
 */

export const DONATE_AMOUNTS = [3, 5, 10] as const;
export const DONATE_CURRENCY = "EUR";
export const DONATE_MIN = 1;
export const DONATE_MAX = 500;

/** Основная ссылка владельца — работает даже без env-переменной */
export const DEFAULT_DONATE_URL = "https://www.paypal.me/SergejZarev";

export function getDonateUrl(): string {
  const v = import.meta.env.VITE_DONATE_URL;
  if (typeof v === "string" && v.trim().startsWith("https://")) {
    return v.trim().replace(/\/+$/, "");
  }
  return DEFAULT_DONATE_URL;
}

export function isDonateConfigured(): boolean {
  return getDonateUrl().startsWith("https://");
}

/** Похоже ли на «голый» PayPal.Me без суммы: paypal.me/username */
function isBarePayPalMe(url: string): boolean {
  return /^https:\/\/(www\.)?paypal\.me\/[A-Za-z0-9._-]+\/?$/.test(url);
}

/**
 * Строит ссылку с суммой. Для голого paypal.me дописываем /{amount}{currency},
 * иначе возвращаем ссылку как есть (там сумма выбирается на стороне PayPal).
 */
export function buildDonateUrl(amount: number): string {
  const base = getDonateUrl();
  if (!base) return "";
  const safe = Math.max(DONATE_MIN, Math.min(DONATE_MAX, Math.round(amount) || DONATE_MIN));
  if (isBarePayPalMe(base)) return `${base}/${safe}${DONATE_CURRENCY}`;
  return base;
}

export function openDonate(amount: number): void {
  const url = buildDonateUrl(amount);
  if (url) window.open(url, "_blank", "noopener");
}
