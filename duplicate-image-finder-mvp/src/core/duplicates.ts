import type { DuplicateGroup, ImageFile } from "../types";

/** FR-3, шаг 1: кандидаты — файлы, чей размер встречается более одного раза */
export function sizeCollisionCandidates(files: ImageFile[]): ImageFile[] {
  const bySize = new Map<number, ImageFile[]>();
  for (const f of files) {
    const arr = bySize.get(f.size);
    if (arr) arr.push(f);
    else bySize.set(f.size, [f]);
  }
  const out: ImageFile[] = [];
  for (const arr of bySize.values()) {
    if (arr.length > 1) out.push(...arr);
  }
  return out;
}

/** FR-3, шаг 2: точные группы по совпавшему SHA-256 */
export function exactGroups(files: ImageFile[]): DuplicateGroup[] {
  const byHash = new Map<string, ImageFile[]>();
  for (const f of files) {
    if (!f.sha256) continue;
    const arr = byHash.get(f.sha256);
    if (arr) arr.push(f);
    else byHash.set(f.sha256, [f]);
  }
  const raw = [...byHash.entries()].filter(([, arr]) => arr.length > 1);
  raw.sort((a, b) => b[1][0].size * b[1].length - a[1][0].size * a[1].length);
  return raw.map(([hash, arr], i) => ({
    id: `ex-${i}`,
    kind: "exact" as const,
    files: [...arr].sort((a, b) => a.path.localeCompare(b.path)),
    bytesEach: arr[0].size,
    hash,
  }));
}

/** пары индексов (в массиве files), которые уже являются точными дублями */
export function exactPairIndices(files: ImageFile[]): number[] {
  const byHash = new Map<string, number[]>();
  files.forEach((f, i) => {
    if (!f.sha256) return;
    const arr = byHash.get(f.sha256);
    if (arr) arr.push(i);
    else byHash.set(f.sha256, [i]);
  });
  const pairs: number[] = [];
  for (const idxs of byHash.values()) {
    if (idxs.length < 2) continue;
    for (let a = 0; a < idxs.length; a++) {
      for (let b = a + 1; b < idxs.length; b++) pairs.push(idxs[a], idxs[b]);
    }
  }
  return pairs;
}

/** файлы, входящие хотя бы в одну группу (без повторов) */
export function filesInGroups(groups: DuplicateGroup[]): ImageFile[] {
  const seen = new Set<string>();
  const out: ImageFile[] = [];
  for (const g of groups) {
    for (const f of g.files) {
      if (!seen.has(f.id)) {
        seen.add(f.id);
        out.push(f);
      }
    }
  }
  return out;
}
