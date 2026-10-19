import { Zip, ZipPassThrough } from "fflate";
import type { ImageFile } from "../types";

/**
 * П. 6 ТЗ (запасной режим): «Скачать ZIP без дубликатов».
 * Потоковая сборка через fflate — файлы читаются по одному, UI не блокируется.
 */
export async function buildCleanZip(keeps: ImageFile[], onProgress: (pct: number) => void): Promise<Blob> {
  const chunks: Uint8Array[] = [];
  let failure: Error | null = null;
  const zip = new Zip((err, chunk) => {
    if (err) failure = err instanceof Error ? err : new Error(String(err));
    else chunks.push(chunk);
  });

  const usedPaths = new Set<string>();
  try {
    for (let i = 0; i < keeps.length; i++) {
      const f = keeps[i];
      let path = f.path;
      let k = 1;
      while (usedPaths.has(path)) path = `${k++}-${f.path}`;
      usedPaths.add(path);

      const data = new Uint8Array(await f.blob.arrayBuffer());
      const part = new ZipPassThrough(path);
      zip.add(part);
      part.push(data, true);
      onProgress(Math.round(((i + 1) / keeps.length) * 100));
      if (i % 10 === 9) await new Promise((r) => setTimeout(r, 0));
    }
  } finally {
    zip.end();
  }
  if (failure) throw failure;
  return new Blob(chunks as BlobPart[], { type: "application/zip" });
}

export function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** список дубликатов для копирования (п. 6) */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
