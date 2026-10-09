import ImageWorker from "../worker/hash.worker.ts?worker&inline";
import type { DHashBits, WorkerOut } from "../worker/hash.worker";
import type { DuplicateGroup, ImageFile } from "../types";
import { exactPairIndices } from "./duplicates";

export interface SimilarStats {
  /** минимальная дистанция среди всех проверенных пар; -1 если пар нет */
  minDist: number;
  /** индексы файлов ближайшей пары (в массиве files) либо null */
  minPair: [number, number] | null;
  pairsChecked: number;
  validCount: number;
  threshold: number;
}

export interface SimilarResult {
  groups: DuplicateGroup[];
  stats: SimilarStats;
}

/**
 * Группировка похожих в отдельном воркере (O(n²) по хешам, UI не трогает).
 * Пары, которые уже являются точными дублями, исключаются — чтобы
 * «похожие» показывались отдельно от точных (FR-4).
 */
export function runSimilarGrouping(
  files: ImageFile[],
  threshold: number,
  onProgress?: (done: number, total: number) => void
): Promise<SimilarResult> {
  return new Promise((resolve, reject) => {
    const valid: number[] = [];
    const hashes: DHashBits[] = files.map((f, i) => {
      const ok = !f.broken && f.dhashHi !== undefined && f.dhashLo !== undefined;
      if (ok) valid.push(i);
      return { hi: f.dhashHi ?? 0, lo: f.dhashLo ?? 0 };
    });
    if (valid.length < 2) {
      resolve({
        groups: [],
        stats: { minDist: -1, minPair: null, pairsChecked: 0, validCount: valid.length, threshold },
      });
      return;
    }
    const excludePairs = exactPairIndices(files);

    const w = new ImageWorker();
    const cleanup = () => w.terminate();
    w.onmessage = (ev: MessageEvent<WorkerOut>) => {
      const m = ev.data;
      if (m.kind === "similar-progress") {
        onProgress?.(m.done, m.total);
        return;
      }
      cleanup();
      if (m.kind === "similar" && m.ok) {
        resolve({
          groups: buildGroups(files, m.components, m.maxDists, m.repDists),
          stats: {
            minDist: m.minDist,
            minPair: m.minPair,
            pairsChecked: m.pairsChecked,
            validCount: valid.length,
            threshold,
          },
        });
      } else {
        reject(new Error("error" in m ? m.error : "similar grouping failed"));
      }
    };
    w.onerror = (e) => {
      cleanup();
      reject(new Error(e.message || "worker error"));
    };
    w.postMessage({ id: 1, kind: "similar", hashes, valid, excludePairs, threshold });
  });
}

function buildGroups(
  files: ImageFile[],
  components: number[][],
  maxDists: number[],
  repDists: number[][]
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = components.map((idxs, i) => {
    // несём дистанцию вместе с файлом, чтобы сортировка по пути её не сбила
    const paired = idxs
      .map((ix, k) => ({ f: files[ix], d: repDists[i]?.[k] ?? 0 }))
      .filter((p): p is { f: ImageFile; d: number } => Boolean(p.f))
      .sort((a, b) => a.f.path.localeCompare(b.f.path));
    return {
      id: `sim-${i}`,
      kind: "similar" as const,
      files: paired.map((p) => p.f),
      bytesEach: -1,
      maxDist: maxDists[i] ?? 0,
      dists: paired.map((p) => p.d),
    };
  });
  groups.sort((a, b) => (a.maxDist ?? 0) - (b.maxDist ?? 0) || b.files.length - a.files.length);
  groups.forEach((g, i) => (g.id = `sim-${i}`));
  return groups;
}
