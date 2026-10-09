/**
 * Web Worker: SHA-256 (Web Crypto), перцептивный dHash 9×8 и
 * группировка похожих по расстоянию Хэмминга (union-find).
 * Никаких сетевых операций — только локальные вычисления.
 */

export interface DHashBits {
  hi: number;
  lo: number;
}

export type WorkerIn =
  | { id: number; kind: "hash"; blob: Blob }
  | { id: number; kind: "dhash"; blob: Blob }
  | {
      id: number;
      kind: "similar";
      hashes: DHashBits[];
      valid: number[];
      /** плоские пары индексов [i, j, i, j…] — исключить (точные дубли) */
      excludePairs: number[];
      threshold: number;
    };

export type WorkerOut =
  | { id: number; kind: "hash"; ok: true; sha256: string }
  | { id: number; kind: "dhash"; ok: true; hi: number; lo: number; width: number; height: number }
  | {
      id: number;
      kind: "similar";
      ok: true;
      components: number[][];
      maxDists: number[];
      /** дистанция каждого файла компоненты до её эталона (позиция 0) */
      repDists: number[][];
      /** минимальная дистанция среди ВСЕХ проверенных пар (для подсказки порога); -1 если пар нет */
      minDist: number;
      /** индексы файлов ближайшей пары (в массиве files) либо null */
      minPair: [number, number] | null;
      /** сколько пар реально сравнили (без исключённых точных) */
      pairsChecked: number;
    }
  | { id: number; kind: "similar-progress"; done: number; total: number }
  | { id: number; kind: "hash" | "dhash" | "similar"; ok: false; error: string };

const ctx = self as unknown as Worker;

async function sha256Hex(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const v = new Uint8Array(digest);
  const parts = new Array<string>(v.length);
  for (let i = 0; i < v.length; i++) parts[i] = v[i].toString(16).padStart(2, "0");
  return parts.join("");
}

/** dHash 64 бит: 9×8 в градациях серого, сравнение соседних пикселей по горизонтали */
async function dhashWithDims(blob: Blob): Promise<{ hi: number; lo: number; width: number; height: number }> {
  // from-image: нормализуем EXIF-ориентацию, иначе повёрнутая копия даст чужой хеш
  const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
  const { width, height } = bmp;
  const canvas = new OffscreenCanvas(9, 8);
  const g = canvas.getContext("2d", { willReadFrequently: true });
  if (!g) throw new Error("no-2d-context");
  g.imageSmoothingEnabled = true;
  // Двухступенчатое сжатие: 4000px → 9px за один шаг даёт алиасинг,
  // и большой файл (2 МБ) разъезжается с маленьким (70 КБ) на 10+ бит.
  // Промежуточный 72×64 с high-качеством делает хеши стабильными.
  g.imageSmoothingQuality = "high";
  if (width > 144 || height > 128) {
    const tmp = new OffscreenCanvas(72, 64);
    const tg = tmp.getContext("2d");
    if (tg) {
      tg.imageSmoothingEnabled = true;
      tg.imageSmoothingQuality = "high";
      tg.drawImage(bmp, 0, 0, 72, 64);
      bmp.close();
      g.drawImage(tmp, 0, 0, 9, 8);
    } else {
      g.drawImage(bmp, 0, 0, 9, 8);
      bmp.close();
    }
  } else {
    g.drawImage(bmp, 0, 0, 9, 8);
    bmp.close();
  }

  const { data } = g.getImageData(0, 0, 9, 8);
  const gray = new Float32Array(72);
  for (let i = 0; i < 72; i++) {
    const p = i * 4;
    gray[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }
  let hi = 0;
  let lo = 0;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const i = y * 9 + x;
      if (gray[i] > gray[i + 1]) {
        const bit = y * 8 + x;
        if (bit < 32) lo += Math.pow(2, bit);
        else hi += Math.pow(2, bit - 32);
      }
    }
  }
  return { hi, lo, width, height };
}

function popcount(x: number): number {
  x = x >>> 0;
  x -= (x >>> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

export function hamming(a: DHashBits, b: DHashBits): number {
  return popcount(a.hi ^ b.hi) + popcount(a.lo ^ b.lo);
}

const PAIR_BASE = 1_000_000;

function buildSimilar(
  id: number,
  hashes: DHashBits[],
  valid: number[],
  excludePairs: number[],
  threshold: number
): void {
  const n = valid.length;
  const parent = new Int32Array(n);
  for (let i = 0; i < n; i++) parent[i] = i;
  const posOf = new Map<number, number>();
  valid.forEach((fileIdx, pos) => posOf.set(fileIdx, pos));
  const find = (x: number): number => {
    let r = x;
    while (parent[r] !== r) r = parent[r];
    while (parent[x] !== r) {
      const next = parent[x];
      parent[x] = r;
      x = next;
    }
    return r;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  const excluded = new Set<number>();
  for (let i = 0; i + 1 < excludePairs.length; i += 2) {
    const a = posOf.get(excludePairs[i]);
    const b = posOf.get(excludePairs[i + 1]);
    if (a === undefined || b === undefined) continue;
    excluded.add(Math.min(a, b) * PAIR_BASE + Math.max(a, b));
  }

  const edges: number[] = []; // [posA, posB, dist] …
  let minDist = 65;
  let minPair: [number, number] | null = null;
  let pairsChecked = 0;
  for (let a = 0; a < n; a++) {
    const ha = hashes[valid[a]];
    for (let b = a + 1; b < n; b++) {
      if (excluded.has(a * PAIR_BASE + b)) continue;
      const d = hamming(ha, hashes[valid[b]]);
      pairsChecked++;
      if (d < minDist) {
        minDist = d;
        minPair = [valid[a], valid[b]];
      }
      if (d <= threshold) {
        union(a, b);
        edges.push(a, b, d);
      }
    }
    if (a % 300 === 0) {
      ctx.postMessage({ id, kind: "similar-progress", done: a, total: n } satisfies WorkerOut);
    }
  }
  if (pairsChecked === 0) {
    minDist = -1;
    minPair = null;
  }

  const byRoot = new Map<number, number[]>();
  for (let p = 0; p < n; p++) {
    const r = find(p);
    const arr = byRoot.get(r);
    if (arr) arr.push(p);
    else byRoot.set(r, [p]);
  }
  const maxDistByRoot = new Map<number, number>();
  for (let e = 0; e + 2 < edges.length; e += 3) {
    const r = find(edges[e]);
    maxDistByRoot.set(r, Math.max(maxDistByRoot.get(r) ?? 0, edges[e + 2]));
  }

  const components: number[][] = [];
  const maxDists: number[] = [];
  const repDists: number[][] = [];
  for (const [root, positions] of byRoot) {
    if (positions.length < 2) continue;
    const fileIdxs = positions.map((p) => valid[p]);
    components.push(fileIdxs);
    maxDists.push(maxDistByRoot.get(root) ?? 0);
    // эталон — первый файл компоненты; дистанция 0 для него самого
    const repHash = hashes[fileIdxs[0]];
    repDists.push(fileIdxs.map((fi) => hamming(repHash, hashes[fi])));
  }
  ctx.postMessage(
    { id, kind: "similar", ok: true, components, maxDists, repDists, minDist, minPair, pairsChecked } satisfies WorkerOut
  );
}

ctx.onmessage = async (ev: MessageEvent<WorkerIn>) => {
  const msg = ev.data;
  try {
    if (msg.kind === "hash") {
      const sha256 = await sha256Hex(msg.blob);
      ctx.postMessage({ id: msg.id, kind: "hash", ok: true, sha256 } satisfies WorkerOut);
    } else if (msg.kind === "dhash") {
      const r = await dhashWithDims(msg.blob);
      ctx.postMessage({ id: msg.id, kind: "dhash", ok: true, ...r } satisfies WorkerOut);
    } else if (msg.kind === "similar") {
      buildSimilar(msg.id, msg.hashes, msg.valid, msg.excludePairs, msg.threshold);
    }
  } catch (e) {
    ctx.postMessage({
      id: msg.id,
      kind: msg.kind,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    } satisfies WorkerOut);
  }
};
