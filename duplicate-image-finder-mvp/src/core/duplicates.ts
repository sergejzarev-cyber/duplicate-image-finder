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
  // larger groups first
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
  if (a.length !== b.length) return 64;
  let dist = 0;
  for (let i = 0; i < a.length; i += 2) {
    let x = parseInt(a.slice(i, i + 2), 16) ^ parseInt(b.slice(i, i + 2), 16);
    // count bits
    x = x - ((x >>> 1) & 0x55);
    x = (x & 0x33) + ((x >>> 2) & 0x33);
    dist += (((x + (x >>> 4)) & 0x0f) * 0x01) & 0xff;
  }
  return dist;
}

/**
 * Greedy clustering by dHash Hamming distance.
 * Files already in exact duplicate groups should be excluded by caller.
 */
export function buildSimilarGroups(
  files: ImageFile[],
  threshold: number,
  selectionRule: SelectionRule
): DuplicateGroup[] {
  const withHash = files.filter((f) => f.dhash && !f.broken);
  const used = new Set<string>();
  const groups: DuplicateGroup[] = [];

  for (let i = 0; i < withHash.length; i++) {
    const seed = withHash[i];
    if (used.has(seed.id)) continue;
    const cluster: ImageFile[] = [seed];
    let maxDist = 0;
    used.add(seed.id);

    for (let j = i + 1; j < withHash.length; j++) {
      const other = withHash[j];
      if (used.has(other.id)) continue;
      const d = hammingDistanceHex(seed.dhash!, other.dhash!);
      if (d <= threshold) {
        cluster.push(other);
        used.add(other.id);
        if (d > maxDist) maxDist = d;
      }
    }

    if (cluster.length > 1) {
      groups.push({
        id: `similar-${seed.dhash}-${cluster.length}`,
        type: 'similar',
        hash: seed.dhash!,
        files: cluster,
        recommendation: recommendKeep(cluster, selectionRule),
        maxDistance: maxDist,
      });
    }
  }

  groups.sort((a, b) => b.files.length - a.files.length);
  return groups;
}
