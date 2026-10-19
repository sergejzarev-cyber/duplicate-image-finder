/** Similar v2: человеко-понятная шкала схожести поверх дистанции Хэмминга (0–64). */

export const DHASH_BITS = 64;
/** максимум слайдера: 20 бит ≈ 69% — ловит сильное пережатие (2 МБ vs 70 КБ) */
export const MAX_THRESHOLD = 20;

/** дистанция Хэмминга → процент схожести (0 бит = 100%) */
export function similarityPct(dist: number): number {
  const d = Math.max(0, Math.min(DHASH_BITS, Math.round(dist)));
  return Math.round(((DHASH_BITS - d) / DHASH_BITS) * 100);
}

export type PresetId = "strict" | "balanced" | "loose";

export interface ThresholdPreset {
  id: PresetId;
  value: number;
}

/** пресеты строгости: строгий ≤3 (~95%), сбалансированный ≤5 (~92%), мягкий ≤10 (~84%) */
export const THRESHOLD_PRESETS: ThresholdPreset[] = [
  { id: "strict", value: 3 },
  { id: "balanced", value: 5 },
  { id: "loose", value: 10 },
];

/** какой пресет ближе всего к текущему значению слайдера (для подсветки) */
export function nearestPreset(value: number): PresetId {
  let best: PresetId = "balanced";
  let bestGap = Infinity;
  for (const p of THRESHOLD_PRESETS) {
    const gap = Math.abs(p.value - value);
    if (gap < bestGap) {
      bestGap = gap;
      best = p.id;
    }
  }
  return best;
}

/** цвет бейджа процента: зелёный ≥97, янтарный ≥92, иначе оранжевый */
export function pctBadgeClass(pct: number): string {
  if (pct >= 97) return "bg-emerald-600 text-white";
  if (pct >= 92) return "bg-amber-500 text-white";
  return "bg-orange-600 text-white";
}
