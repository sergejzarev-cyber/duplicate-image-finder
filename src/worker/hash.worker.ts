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
      const out: OutMessage = { type: 'result', id: msg.id, path: msg.path, sha256: sha };
      self.postMessage(out);
      return;
    }

    if (msg.type === 'analyze') {
      const sha = await sha256(msg.buffer);
      let width: number | undefined;
      let height: number | undefined;
      let dhash: string | undefined;
      let broken = false;
      let error: string | undefined;

      if (msg.computeDhash) {
        try {
          const meta = await analyzeImage(msg.buffer);
          width = meta.width;
          height = meta.height;
          dhash = meta.dhash;
        } catch (err: unknown) {
          broken = true;
          error = err instanceof Error ? err.message : 'broken image';
        }
      }

      const out: OutMessage = {
        type: 'result',
        id: msg.id,
        path: msg.path,
        sha256: sha,
        dhash,
        width,
        height,
        broken,
        error,
      };
      self.postMessage(out);
    }
  } catch (err: unknown) {
    const out: OutMessage = {
      type: 'error',
      id: msg.id,
      message: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(out);
  }
};

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function analyzeImage(buffer: ArrayBuffer): Promise<{ width: number; height: number; dhash: string }> {
  const blob = new Blob([buffer]);
  const bitmap = await createImageBitmap(blob);
  try {
    const width = bitmap.width;
    const height = bitmap.height;
    // dHash: resize to 9x8, grayscale, compare adjacent pixels horizontally → 64 bits
    const canvas = new OffscreenCanvas(9, 8);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('2d context unavailable');
    ctx.drawImage(bitmap, 0, 0, 9, 8);
    const { data } = ctx.getImageData(0, 0, 9, 8);

    let bits = '';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const i = (y * 9 + x) * 4;
        const j = (y * 9 + x + 1) * 4;
        const g1 = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const g2 = data[j] * 0.299 + data[j + 1] * 0.587 + data[j + 2] * 0.114;
        bits += g1 < g2 ? '1' : '0';
      }
    }

    // bits → 16 hex chars
    let hex = '';
    for (let i = 0; i < 64; i += 4) {
      hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    }

    return { width, height, dhash: hex };
  } finally {
    bitmap.close();
  }
}

export {};
