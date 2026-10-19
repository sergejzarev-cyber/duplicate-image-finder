/// <reference lib="webworker" />

export type InMessage =
  | { type: 'sha256'; id: string; path: string; buffer: ArrayBuffer }
  | { type: 'analyze'; id: string; path: string; buffer: ArrayBuffer; computeDhash: boolean };

export type OutMessage =
  | {
      type: 'result';
      id: string;
      path: string;
      sha256?: string;
      dhash?: string;
      phash?: string;
      width?: number;
      height?: number;
      broken?: boolean;
      error?: string;
    }
  | { type: 'error'; id?: string; message: string };

self.onmessage = async (e: MessageEvent<InMessage>) => {
  const msg = e.data;
  try {
    if (msg.type === 'sha256') {
      const sha = await sha256(msg.buffer);
      self.postMessage({ type: 'result', id: msg.id, path: msg.path, sha256: sha } satisfies OutMessage);
      return;
    }

    if (msg.type === 'analyze') {
      const sha = await sha256(msg.buffer);
      let width: number | undefined;
      let height: number | undefined;
      let dhash: string | undefined;
      let phash: string | undefined;
      let broken = false;
      let error: string | undefined;

      if (msg.computeDhash) {
        try {
          const meta = await analyzeImage(msg.buffer);
          width = meta.width;
          height = meta.height;
          dhash = meta.dhash;
          phash = meta.phash;
        } catch (err: unknown) {
          broken = true;
          error = err instanceof Error ? err.message : 'broken image';
        }
      }

      self.postMessage({
        type: 'result',
        id: msg.id,
        path: msg.path,
        sha256: sha,
        dhash,
        phash,
        width,
        height,
        broken,
        error,
      } satisfies OutMessage);
    }
  } catch (err: unknown) {
    self.postMessage({
      type: 'error',
      id: msg.id,
      message: err instanceof Error ? err.message : String(err),
    } satisfies OutMessage);
  }
};

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function analyzeImage(buffer: ArrayBuffer): Promise<{
  width: number;
  height: number;
  dhash: string;
  phash: string;
}> {
  const blob = new Blob([buffer]);
  // Try both orientations if EXIF orientation matters — createImageBitmap handles most cases
  const bitmap = await createImageBitmap(blob);
  try {
    const width = bitmap.width;
    const height = bitmap.height;
    if (width < 2 || height < 2) throw new Error('image too small');

    // dHash via cover-fit 9x8
    const dCanvas = new OffscreenCanvas(9, 8);
    const dctx = dCanvas.getContext('2d', { willReadFrequently: true });
    if (!dctx) throw new Error('2d context unavailable');
    drawCover(dctx, bitmap, 9, 8);
    const dGray = toGray(dctx.getImageData(0, 0, 9, 8).data, 72);
    const dhash = horizontalDHash(dGray, 9, 8);

    // average hash 8x8 (robust to compression)
    const pCanvas = new OffscreenCanvas(8, 8);
    const pctx = pCanvas.getContext('2d', { willReadFrequently: true });
    if (!pctx) throw new Error('2d context unavailable');
    drawCover(pctx, bitmap, 8, 8);
    const pGray = toGray(pctx.getImageData(0, 0, 8, 8).data, 64);
    const phash = averageHash(pGray);

    return { width, height, dhash, phash };
  } finally {
    bitmap.close();
  }
}

function drawCover(
  ctx: OffscreenCanvasRenderingContext2D,
  bitmap: ImageBitmap,
  tw: number,
  th: number
) {
  const width = bitmap.width;
  const height = bitmap.height;
  const scale = Math.max(tw / width, th / height);
  const sw = tw / scale;
  const sh = th / scale;
  const sx = (width - sw) / 2;
  const sy = (height - sh) / 2;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, tw, th);
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, tw, th);
}

function toGray(data: Uint8ClampedArray, n: number): Float32Array {
  const g = new Float32Array(n);
  for (let i = 0, p = 0; p < n; i += 4, p++) {
    g[p] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }
  return g;
}

function horizontalDHash(gray: Float32Array, w: number, h: number): string {
  let bits = '';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w - 1; x++) {
      bits += gray[y * w + x] < gray[y * w + x + 1] ? '1' : '0';
    }
  }
  return bitsToHex(bits);
}

function averageHash(gray: Float32Array): string {
  let sum = 0;
  for (let i = 0; i < gray.length; i++) sum += gray[i];
  const avg = sum / gray.length;
  let bits = '';
  for (let i = 0; i < gray.length; i++) bits += gray[i] >= avg ? '1' : '0';
  return bitsToHex(bits);
}

function bitsToHex(bits: string): string {
  let hex = '';
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4).padEnd(4, '0'), 2).toString(16);
  }
  return hex;
}

export {};
