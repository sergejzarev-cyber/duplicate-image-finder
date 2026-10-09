import type { ImageFile, KeepRule } from "../types";

function score(f: ImageFile, rule: KeepRule): number {
  switch (rule) {
    case "resolution":
      return (f.width ?? 0) * (f.height ?? 0);
    case "oldest":
      return -f.lastModified;
    case "newest":
      return f.lastModified;
    case "shortest":
      return -f.name.length;
  }
}

/**
 * FR-5: какой файл оставить в группе.
 * Повреждённые файлы («битые») никогда не выбираются как «оставить».
 * При равенстве очков — детерминированный выбор по пути.
 */
export function pickKeepId(files: ImageFile[], rule: KeepRule): string | null {
  const ok = files.filter((f) => !f.broken);
  const first = ok[0];
  if (!first) return null;
  let best = first;
  for (const f of ok) {
    const sf = score(f, rule);
    const sb = score(best, rule);
    if (sf > sb || (sf === sb && f.path.localeCompare(best.path) < 0)) best = f;
  }
  return best.id;
}

export const KEEP_RULES: KeepRule[] = ["resolution", "oldest", "newest", "shortest"];
