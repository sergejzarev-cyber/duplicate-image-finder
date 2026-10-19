import type { SelectionRule } from '../types';
export type { SelectionRule } from '../types';

export function getSelectionLabel(rule: SelectionRule, lang: string): string {
  const labels: Record<string, Record<SelectionRule, string>> = {
    ru: {
      'largest-resolution': 'Самое большое разрешение',
      oldest: 'Самый старый',
      newest: 'Самый новый',
      'shortest-name': 'Самое короткое имя',
    },
    en: {
      'largest-resolution': 'Largest resolution',
      oldest: 'Oldest',
      newest: 'Newest',
      'shortest-name': 'Shortest name',
    },
    de: {
      'largest-resolution': 'Größte Auflösung',
      oldest: 'Älteste',
      newest: 'Neueste',
      'shortest-name': 'Kürzester Name',
    },
  };
  return labels[lang]?.[rule] ?? labels['en'][rule] ?? String(rule);
}
