/**
 * Shared image fingerprint helpers (main thread + documentation of algorithm).
 * Worker has its own copy for isolation.
 */

export async function computeImageFingerprints(buffer: ArrayBuffer): Promise<{
  width: number;
  height: number;
  dhash: string;
  phash: string;
}> {
  const blob = new Blob([buffer]);
  const bitmap = await createImageBitmap(blob);
  try {
    const width = bitmap.width;
    const height = bitmap.height;
    if (width < 2 || height < 2) throw new Error('image too small');

    // --- dHash 9x8 ---
    const dCanvas = document.createElement('canvas');
    dCanvas.width = 9;
    dCanvas.height = 8;
    const dctx = dCanvas.getContext('2d', { willReadFrequently: true });
    if (!dctx) throw new Error('canvas');
    drawCover(dctx, bitmap, 9, 8);
    const dData = dctx.getImageData(0, 0, 9, 8).data;
    const dGray = toGray(dData, 9 * 8);
    const dhash = horizontalDHash(dGray, 9, 8);

    // --- aHash / pHash-lite on 8x8 ---
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 8;
    pCanvas.height = 8;
    const pctx = pCanvas.getContext('2d', { willReadFrequently: true });
    if (!pctx) throw new Error('canvas');
    drawCover(pctx, bitmap, 8, 8);
    const pData = pctx.getImageData(0, 0, 8, 8).data;
    const pGray = toGray(pData, 64);
    const phash = averageHash(pGray);

    return { width, height, dhash, phash };
  } finally {
    bitmap.close();
  }
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  tw: number,
  th: number
) {
  const width = bitmap.width;
  const height = bitmap.height;
  // cover: scale to fill, center crop
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
