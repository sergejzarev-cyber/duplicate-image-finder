import type { ImageFile, DuplicateGroup, SelectionRule } from '../types';

export function groupBySize(files: ImageFile[]): Map<number, ImageFile[]> {
  const map = new Map<number, ImageFile[]>();
  for (const f of files) {
    const arr = map.get(f.size) ?? [];
    arr.push(f);
    map.set(f.size, arr);
  }
  return map;
}

export function buildExactGroups(
  hashMap: Map<string, ImageFile[]>,
  selectionRule: SelectionRule
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  for (const [hash, fileList] of hashMap.entries()) {
    if (fileList.length > 1) {
      groups.push({
        id: `exact-${hash.slice(0, 16)}`,
        type: 'exact',
        hash,
        files: fileList,
        recommendation: recommendKeep(fileList, selectionRule),
      });
    }
  }
  groups.sort((a, b) => b.files.length - a.files.length || b.files[0].size - a.files[0].size);
  return groups;
}

export function recommendKeep(files: ImageFile[], rule: SelectionRule): ImageFile {
  const sorted = [...files];
  switch (rule) {
    case 'largest-resolution': {
      sorted.sort((a, b) => {
        const pa = (a.width ?? 0) * (a.height ?? 0);
        const pb = (b.width ?? 0) * (b.height ?? 0);
        if (pb !== pa) return pb - pa;
        if (b.size !== a.size) return b.size - a.size;
        return a.name.length - b.name.length;
      });
      break;
    }
    case 'oldest':
      sorted.sort((a, b) => a.lastModified - b.lastModified || a.name.localeCompare(b.name));
      break;
    case 'newest':
      sorted.sort((a, b) => b.lastModified - a.lastModified || a.name.localeCompare(b.name));
      break;
    case 'shortest-name':
      sorted.sort((a, b) => a.name.length - b.name.length || a.name.localeCompare(b.name));
      break;
  }
  return sorted[0];
}

/** Hamming distance between hex strings (any length). */
export function hammingDistanceHex(a: string, b: string): number {
  if (!a || !b) return 64;
  const n = Math.min(a.length, b.length);
  let dist = 0;
  for (let i = 0; i < n; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    // count bits in nibble
    x = x - ((x >>> 1) & 0x5);
    x = (x & 0x3) + ((x >>> 2) & 0x3);
    dist += x & 0xf;
  }
  dist += Math.abs(a.length - b.length) * 4;
  return dist;
}

/** Combined distance: min of dHash and pHash distances (more recall). */
export function similarDistance(a: ImageFile, b: ImageFile): number {
  const distances: number[] = [];
  if (a.dhash && b.dhash) distances.push(hammingDistanceHex(a.dhash, b.dhash));
  if (a.phash && b.phash) distances.push(hammingDistanceHex(a.phash, b.phash));
  if (distances.length === 0) return 64;
  return Math.min(...distances);
}

class UnionFind {
  parent: number[];
  rank: number[];
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }
  find(x: number): number {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }
  union(a: number, b: number) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    if (this.rank[ra] < this.rank[rb]) this.parent[ra] = rb;
    else if (this.rank[ra] > this.rank[rb]) this.parent[rb] = ra;
    else {
      this.parent[rb] = ra;
      this.rank[ra]++;
    }
  }
}

/**
 * Cluster similar images using dHash + pHash (min distance) and Union-Find.
 */
export function buildSimilarGroups(
  files: ImageFile[],
  threshold: number,
  selectionRule: SelectionRule
): DuplicateGroup[] {
  const withHash = files.filter(
    (f) => !f.broken && ((f.dhash && f.dhash.length >= 16) || (f.phash && f.phash.length >= 16))
  );
  const n = withHash.length;
  if (n < 2) return [];

  const uf = new UnionFind(n);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = similarDistance(withHash[i], withHash[j]);
      if (d <= threshold) uf.union(i, j);
    }
  }

  const buckets = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const r = uf.find(i);
    const arr = buckets.get(r) ?? [];
    arr.push(i);
    buckets.set(r, arr);
  }

  const groups: DuplicateGroup[] = [];
  for (const indices of buckets.values()) {
    if (indices.length < 2) continue;
    const cluster = indices.map((i) => withHash[i]);

    let maxDist = 0;
    let minDist = 64;
    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        const d = similarDistance(withHash[indices[a]], withHash[indices[b]]);
        if (d > maxDist) maxDist = d;
        if (d < minDist) minDist = d;
      }
    }

    const seed = cluster[0];
    groups.push({
      id: `similar-${seed.dhash ?? seed.phash}-${cluster.length}-${seed.id}`,
      type: 'similar',
      hash: seed.dhash ?? seed.phash ?? 'unknown',
      files: cluster,
      recommendation: recommendKeep(cluster, selectionRule),
      maxDistance: maxDist,
    });
  }

  groups.sort(
    (a, b) => b.files.length - a.files.length || (a.maxDistance ?? 0) - (b.maxDistance ?? 0)
  );
  return groups;
}

export function similarityLabel(maxDistance: number | undefined, threshold: number): string {
  if (maxDistance == null) return '';
  if (maxDistance <= Math.max(1, Math.floor(threshold * 0.35))) return 'very-close';
  if (maxDistance <= Math.max(2, Math.floor(threshold * 0.7))) return 'close';
  return 'loose';
}

/** Debug helper: pairwise min distances for console */
export function debugSimilarPairs(files: ImageFile[], limit = 20): string[] {
  const list = files.filter((f) => f.dhash || f.phash);
  const lines: string[] = [];
  for (let i = 0; i < list.length && lines.length < limit; i++) {
    for (let j = i + 1; j < list.length && lines.length < limit; j++) {
      const d = similarDistance(list[i], list[j]);
      lines.push(
        `${list[i].name} ↔ ${list[j].name}: distance=${d} (dHash ${
          list[i].dhash && list[j].dhash ? hammingDistanceHex(list[i].dhash!, list[j].dhash!) : '-'
        }, pHash ${
          list[i].phash && list[j].phash ? hammingDistanceHex(list[i].phash!, list[j].phash!) : '-'
        })`
      );
    }
  }
  return lines;
}
