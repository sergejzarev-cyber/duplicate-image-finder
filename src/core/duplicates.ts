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

/** Hamming distance between two hex dHash strings (16 hex chars = 64 bit). */
export function hammingDistanceHex(a: string, b: string): number {
  if (!a || !b) return 64;
  const n = Math.min(a.length, b.length);
  let dist = 0;
  // process nibble by nibble for robustness if lengths differ slightly
  for (let i = 0; i < n; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    x = x - ((x >>> 1) & 0x5);
    x = (x & 0x3) + ((x >>> 2) & 0x3);
    dist += x & 0xf;
  }
  dist += Math.abs(a.length - b.length) * 4;
  return dist;
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
 * Cluster similar images by dHash using Union-Find.
 * Compares each pair with early exits; fine for a few thousand images in-browser.
 * Files already in exact groups should be excluded by caller.
 */
export function buildSimilarGroups(
  files: ImageFile[],
  threshold: number,
  selectionRule: SelectionRule
): DuplicateGroup[] {
  const withHash = files.filter((f) => typeof f.dhash === 'string' && f.dhash.length >= 16 && !f.broken);
  const n = withHash.length;
  if (n < 2) return [];

  const uf = new UnionFind(n);
  // pair max distance inside component (approx via edge max)
  const edgeMax = new Map<string, number>();

  for (let i = 0; i < n; i++) {
    const hi = withHash[i].dhash!;
    for (let j = i + 1; j < n; j++) {
      const d = hammingDistanceHex(hi, withHash[j].dhash!);
      if (d <= threshold) {
        uf.union(i, j);
        const ra = uf.find(i);
        const rb = uf.find(j);
        // after union root may change — store under both temporary keys then normalize later
        const key = ra < rb ? `${ra}-${rb}` : `${rb}-${ra}`;
        edgeMax.set(key, Math.max(edgeMax.get(key) ?? 0, d));
      }
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

    // compute real max pairwise distance inside cluster (only small clusters usually)
    let maxDist = 0;
    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        const d = hammingDistanceHex(withHash[indices[a]].dhash!, withHash[indices[b]].dhash!);
        if (d > maxDist) maxDist = d;
      }
    }

    const seed = cluster[0];
    groups.push({
      id: `similar-${seed.dhash}-${cluster.length}-${seed.id}`,
      type: 'similar',
      hash: seed.dhash!,
      files: cluster,
      recommendation: recommendKeep(cluster, selectionRule),
      maxDistance: maxDist,
    });
  }

  groups.sort((a, b) => b.files.length - a.files.length || (a.maxDistance ?? 0) - (b.maxDistance ?? 0));
  return groups;
}

/** Human label for similarity quality */
export function similarityLabel(maxDistance: number | undefined, threshold: number): string {
  if (maxDistance == null) return '';
  if (maxDistance <= Math.max(1, Math.floor(threshold * 0.35))) return 'very-close';
  if (maxDistance <= Math.max(2, Math.floor(threshold * 0.7))) return 'close';
  return 'loose';
}
