import type { ImageFile } from "../types";
import { isHeicName } from "./scanner";

/**
 * HEIC/HEIF (фото с iPhone): браузеры вне Safari не умеют их декодировать
 * (createImageBitmap падает), поэтому конвертируем в JPEG через WASM.
 * Оригинал в file.blob не трогаем — точный поиск идёт по нему,
 * а decodedBlob используется для dHash и превью.
 *
 * @returns число файлов, которые сконвертировать не удалось
 * (показываем честный баннер вместо молчаливого пропуска).
 */
export async function convertHeicFiles(
  files: ImageFile[],
  onProgress?: (done: number, total: number) => void
): Promise<number> {
  const targets = files.filter((f) => isHeicName(f.name));
  if (targets.length === 0) return 0;

  let mod: { default: (o: { blob: Blob; toType: string; quality: number }) => Promise<Blob | Blob[]> };
  try {
    // динамический импорт: WASM-декодер (~1 МБ) грузится только если в папке есть HEIC
    mod = await import("heic2any");
  } catch {
    return targets.length;
  }

  let failed = 0;
  // последовательно: конвертация тяжёлая, параллелить смынием память
  for (let i = 0; i < targets.length; i++) {
    const f = targets[i];
    try {
      const out = await mod.default({ blob: f.blob, toType: "image/jpeg", quality: 0.92 });
      const jpeg = Array.isArray(out) ? out[0] : out;
      if (jpeg && jpeg.size > 0) {
        f.decodedBlob = jpeg;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
    onProgress?.(i + 1, targets.length);
  }
  return failed;
}
