import type { ImageFile, ScanError } from "../types";

export const IMAGE_EXTS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "avif",
  // HEIC/HEIF (iPhone): включаем в скан, для пикселей конвертируем в JPEG через WASM (см. fs/heic.ts)
  "heic",
  "heif",
  "hif",
]);
/** расширения, требующие конвертации перед декодированием */
export const HEIC_EXTS = new Set(["heic", "heif", "hif"]);
/** карантинная папка пропускается при повторных сканированиях */
export const QUARANTINE_DIR = "_duplicates";

export function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function isImageName(name: string): boolean {
  return IMAGE_EXTS.has(extOf(name));
}

export function isHeicName(name: string): boolean {
  return HEIC_EXTS.has(extOf(name));
}

export function supportsFileSystemAccess(): boolean {
  return typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === "function";
}

/**
 * Chrome запрещает file picker в cross-origin iframe
 * («Cross origin sub frames aren't allowed to show a file picker») —
 * типично для превью в онлайн-IDE, встроенных виджетов и т.п.
 */
export function isCrossOriginFrame(): boolean {
  if (window.self === window.top) return false;
  try {
    void window.top!.location.href; // доступно только same-origin
    return false;
  } catch {
    return true;
  }
}

/** ошибка вызова showDirectoryPicker в запрещённом контексте (iframe/secure-context) */
export function isPickerSecurityError(e: unknown): boolean {
  return (
    (e instanceof DOMException && e.name === "SecurityError") ||
    (e instanceof Error && /file picker|cross origin/i.test(e.message))
  );
}

export type FsBlockReason = "none" | "insecure-context" | "cross-origin-frame" | "api-missing";

/**
 * Точная причина недоступности полного режима:
 * insecure-context — нет HTTPS (и не localhost);
 * cross-origin-frame — приложение встроено в чужой iframe;
 * api-missing — браузер не Chromium (Firefox/Safari/WebKit).
 */
export function fsApiBlockReason(): FsBlockReason {
  if (!supportsFileSystemAccess()) {
    return window.isSecureContext ? "api-missing" : "insecure-context";
  }
  if (isCrossOriginFrame()) return "cross-origin-frame";
  return "none";
}

export async function ensureWritePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const h = handle as unknown as {
    queryPermission?: (d: { mode: string }) => Promise<string>;
    requestPermission?: (d: { mode: string }) => Promise<string>;
  };
  if (typeof h.queryPermission !== "function") return true;
  if ((await h.queryPermission({ mode: "readwrite" })) === "granted") return true;
  try {
    return (await h.requestPermission?.({ mode: "readwrite" })) === "granted";
  } catch {
    return false;
  }
}

export interface PickedRoot {
  handle: FileSystemDirectoryHandle;
  canWrite: boolean;
}

/** @returns null, если пользователь отменил диалог */
export async function pickDirectory(): Promise<PickedRoot | null> {
  const picker = (window as unknown as { showDirectoryPicker: (o: object) => Promise<FileSystemDirectoryHandle> })
    .showDirectoryPicker;
  let handle: FileSystemDirectoryHandle;
  try {
    handle = await picker({ id: "dupsweep", mode: "readwrite" });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return null;
    throw e;
  }
  return { handle, canWrite: await ensureWritePermission(handle) };
}

interface DirCtx {
  dir: FileSystemDirectoryHandle;
  prefix: string;
}

/** Обход папки. Читает только метаданные (getFile — stat), содержимое не трогает. */
export async function scanDirectory(
  root: FileSystemDirectoryHandle,
  recursive: boolean,
  signal: AbortSignal,
  onProgress: (found: number) => void
): Promise<{ files: ImageFile[]; errors: ScanError[]; skippedHeic: number }> {
  const files: ImageFile[] = [];
  const errors: ScanError[] = [];
  let skippedHeic = 0;
  const stack: DirCtx[] = [{ dir: root, prefix: "" }];
  const abort = () => new DOMException("Aborted", "AbortError");

  while (stack.length > 0) {
    if (signal.aborted) throw abort();
    const ctx = stack.pop()!;
    const iterable = (
      ctx.dir as unknown as { values: () => AsyncIterable<FileSystemHandle> }
    ).values();

    let sinceTick = 0;
    for await (const entry of iterable) {
      if (signal.aborted) throw abort();
      if (entry.kind === "directory") {
        // _duplicates не спускаемся никогда: перемещённые копии не должны находиться снова.
        // При recursive=false не спускаемся вообще никуда — карантин тем более не виден.
        if (recursive && entry.name !== QUARANTINE_DIR) {
          stack.push({ dir: entry as FileSystemDirectoryHandle, prefix: ctx.prefix + entry.name + "/" });
        }
        continue;
      }
      if (entry.kind !== "file") continue;
      if (!isImageName(entry.name)) continue;
      const path = ctx.prefix + entry.name;
      try {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        files.push({
          id: `f${files.length}`,
          name: entry.name,
          path,
          ext: extOf(entry.name),
          size: file.size,
          lastModified: file.lastModified,
          handle: fileHandle,
          parentHandle: ctx.dir,
          blob: file,
        });
      } catch {
        errors.push({ path, reason: "unreadable" });
      }
      if (++sinceTick % 40 === 0) {
        onProgress(files.length);
        // отдаём управление рендеру
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    onProgress(files.length);
  }
  return { files, errors, skippedHeic };
}

// ---------- запасной режим (input webkitdirectory) ----------

/** @returns null, если пользователь отменил диалог */
export function pickDirectoryFallback(): Promise<File[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    (input as unknown as { webkitdirectory: boolean }).webkitdirectory = true;
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    document.body.appendChild(input);

    let settled = false;
    const done = (files: File[] | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(files);
    };
    input.addEventListener("change", () => done(Array.from(input.files ?? [])));
    input.addEventListener("cancel", () => done(null));
    input.click();
  });
}

export function fromFallbackFiles(
  all: File[],
  recursive: boolean
): { files: ImageFile[]; skippedHeic: number } {
  const out: ImageFile[] = [];
  let skippedHeic = 0;
  for (const f of all) {
    const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
    // _duplicates пропускаем всегда — иначе перемещённые копии находятся снова при повторном скане
    if (rel.split("/").includes(QUARANTINE_DIR)) continue;
    if (!isImageName(f.name)) continue;
    // без рекурсии оставляем только файлы корня выбранной папки
    if (!recursive && rel.split("/").length > 2) continue;
    out.push({
      id: `f${out.length}`,
      name: f.name,
      path: rel,
      ext: extOf(f.name),
      size: f.size,
      lastModified: f.lastModified,
      blob: f,
    });
  }
  return { files: out, skippedHeic };
}
