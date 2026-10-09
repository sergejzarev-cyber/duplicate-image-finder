import type { DeleteMode, DeleteReport, ImageFile } from "../types";
import { QUARANTINE_DIR } from "./scanner";

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Пост-верификация: источник после операции не должен существовать.
 * Файлы иногда «воскресают» — OneDrive-плейсхолдеры (Files On-Demand),
 * антивирус, гонка синхронизации. Такие случаи фиксируем в отчёте.
 */
async function stillExists(dir: FileSystemDirectoryHandle, name: string): Promise<boolean> {
  try {
    await dir.getFileHandle(name);
    return true;
  } catch {
    return false; // NotFoundError — источника больше нет, всё ок
  }
}

/** свободное имя в папке: name.ext → name (1).ext → … */
async function uniqueName(dir: FileSystemDirectoryHandle, name: string): Promise<string> {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  for (let n = 0; ; n++) {
    const candidate = n === 0 ? name : `${base} (${n})${ext}`;
    try {
      await dir.getFileHandle(candidate); // существует — пробуем следующее
    } catch {
      return candidate; // NotFoundError — имя свободно
    }
  }
}

async function moveInto(file: ImageFile, destDir: FileSystemDirectoryHandle): Promise<void> {
  if (!file.handle || !file.parentHandle) throw new Error("no-handle");
  const newName = await uniqueName(destDir, file.name);
  const movable = file.handle as FileSystemFileHandle & {
    move?: (dest: FileSystemDirectoryHandle, name?: string) => Promise<void>;
  };
  if (typeof movable.move === "function") {
    await movable.move(destDir, newName);
    return;
  }
  // запасной путь: скопировать и удалить оригинал
  const data = await file.handle.getFile();
  const out = await destDir.getFileHandle(newName, { create: true });
  const w = await out.createWritable();
  await w.write(data);
  await w.close();
  await file.parentHandle.removeEntry(file.name);
}

/**
 * FR-6: удаление выбранных копий.
 * move — перенос в подпапку _duplicates (восстановимо вручную),
 * permanent — безвозвратное удаление. Ошибки по файлам не прерывают процесс.
 */
export async function runDeletion(
  items: ImageFile[],
  mode: DeleteMode,
  root: FileSystemDirectoryHandle,
  onProgress: (done: number, total: number) => void
): Promise<DeleteReport> {
  const report: DeleteReport = { mode, moved: 0, deleted: 0, freed: 0, errors: [] };

  let quarantine: FileSystemDirectoryHandle | null = null;
  if (mode === "move") {
    try {
      quarantine = await root.getDirectoryHandle(QUARANTINE_DIR, { create: true });
    } catch (e) {
      report.errors.push({ path: QUARANTINE_DIR, reason: errMsg(e) });
      return report;
    }
  }

  for (let i = 0; i < items.length; i++) {
    const f = items[i];
    try {
      if (!f.handle || !f.parentHandle) throw new Error("no-handle");
      if (f.path === QUARANTINE_DIR || f.path.startsWith(QUARANTINE_DIR + "/")) {
        throw new Error("already-in-quarantine");
      }
      if (mode === "move" && quarantine) {
        await moveInto(f, quarantine);
        report.moved++;
      } else {
        await f.parentHandle.removeEntry(f.name);
        report.deleted++;
      }
      report.freed += f.size;

      // верификация результата (см. stillExists)
      if (await stillExists(f.parentHandle, f.name)) {
        if (mode === "move") report.moved--;
        else report.deleted--;
        report.freed -= f.size;
        report.errors.push({ path: f.path, reason: "still-exists-after-delete" });
      }
    } catch (e) {
      report.errors.push({ path: f.path, reason: errMsg(e) });
    }
    onProgress(i + 1, items.length);
    if (i % 25 === 24) await new Promise((r) => setTimeout(r, 0));
  }
  return report;
}
