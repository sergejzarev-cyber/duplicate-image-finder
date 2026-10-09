/**
 * Pro-фундамент (этап монетизации).
 * Сейчас Pro не продаётся: лимиты щедрые, апсейл показывается редко,
 * кнопка ведёт в форму обратной связи («хочу Pro») — так собираем спрос
 * до подключения оплаты (Gumroad / Stripe Payment Links).
 */

export const FREE_SIMILAR_GROUPS = 50;
export const FREE_SCAN_FILES = 5000;

const PRO_KEY = "dupsweep.pro.key";

export function isProActive(): boolean {
  try {
    return localStorage.getItem(PRO_KEY) === "pro-early-access";
  } catch {
    return false;
  }
}

/** сколько групп показываем бесплатно, остальные — под апсейлом */
export function splitByProLimit<T>(items: T[], limit: number): { visible: T[]; locked: number } {
  if (isProActive() || items.length <= limit) return { visible: items, locked: 0 };
  return { visible: items.slice(0, limit), locked: items.length - limit };
}
