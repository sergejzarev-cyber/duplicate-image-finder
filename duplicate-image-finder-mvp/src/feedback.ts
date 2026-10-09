import type { Lang } from "./types";

export type FeedbackCategory = "bug" | "idea" | "praise";

/**
 * Endpoint форм-бэкенда (Formspree-совместимый), задаётся при сборке:
 *   VITE_FEEDBACK_ENDPOINT=https://formspree.io/f/xxxxabcd
 * E-mail получателя хранится только на стороне сервиса и в коде не светится.
 */
export function getFeedbackEndpoint(): string {
  const v = import.meta.env.VITE_FEEDBACK_ENDPOINT;
  return typeof v === "string" ? v.trim() : "";
}

export function isFeedbackConfigured(): boolean {
  return getFeedbackEndpoint().startsWith("https://");
}

export interface FeedbackPayload {
  category: FeedbackCategory;
  message: string;
  /** необязательный e-mail для ответа */
  contact: string;
  lang: Lang;
}

const RATE_KEY = "dupsweep.fb.last";
const RATE_MS = 60_000;

export async function sendFeedback(p: FeedbackPayload): Promise<void> {
  const endpoint = getFeedbackEndpoint();
  if (!endpoint.startsWith("https://")) throw new Error("not-configured");

  const last = Number(localStorage.getItem(RATE_KEY) ?? 0);
  if (Number.isFinite(last) && Date.now() - last < RATE_MS) {
    throw new Error("rate-limited");
  }

  // ВАЖНО: отправляется только текст отзыва. Никаких имён файлов, путей и изображений.
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        category: p.category,
        message: p.message,
        _replyto: p.contact || undefined,
        language: p.lang,
        app: "dupsweep",
        _subject: `DupSweep feedback [${p.category}]`,
        _gotcha: "", // honeypot: боты заполняют, люди — нет
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`http-${res.status}`);
    localStorage.setItem(RATE_KEY, String(Date.now()));
  } finally {
    window.clearTimeout(timer);
  }
}
