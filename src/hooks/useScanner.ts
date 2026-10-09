import { useMemo, useRef, useState } from "react";
import type {
  DeleteMode,
  DeleteReport,
  DeletionCandidate,
  DuplicateGroup,
  Engine,
  ImageFile,
  KeepRule,
  Phase,
  ScanError,
} from "../types";
import {
  ensureWritePermission,
  fromFallbackFiles,
  fsApiBlockReason,
  isHeicName,
  isPickerSecurityError,
  pickDirectory,
  pickDirectoryFallback,
  scanDirectory,
  supportsFileSystemAccess,
  type FsBlockReason,
} from "../fs/scanner";
import { convertHeicFiles } from "../fs/heic";
import { privacyMeter } from "../lib/privacyMeter";
import { loadDemoFiles } from "../fs/demoAssets";
import { WorkerPool } from "../worker/pool";
import type { WorkerOut } from "../worker/hash.worker";
import { exactGroups, filesInGroups, sizeCollisionCandidates } from "../core/duplicates";
import { runSimilarGrouping, type SimilarStats } from "../core/similarRunner";
import { pickKeepId } from "../core/selection";
import { runDeletion } from "../fs/deleteOps";
import { buildCleanZip, copyTextToClipboard, downloadBlob } from "../fs/zipFallback";

export interface Progress {
  done: number;
  total: number;
}

interface ScanSource {
  engine: Engine;
  root: FileSystemDirectoryHandle | null;
  raw: File[] | null;
}

const abortErr = () => new DOMException("Aborted", "AbortError");

const PREFS_KEY = "dupsweep.prefs";

/** Тогглы живут на лендинге (/), а скан — на /app: выбор переживает навигацию. */
function readScanPrefs(): { recursive: boolean; findSimilar: boolean } {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { recursive: true, findSimilar: true };
    const p = JSON.parse(raw) as Partial<{ recursive: unknown; findSimilar: unknown }>;
    return {
      recursive: typeof p.recursive === "boolean" ? p.recursive : true,
      findSimilar: typeof p.findSimilar === "boolean" ? p.findSimilar : true,
    };
  } catch {
    return { recursive: true, findSimilar: true };
  }
}

function writeScanPrefs(p: { recursive: boolean; findSimilar: boolean }): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function useScanner() {
  const supported = useMemo(() => supportsFileSystemAccess(), []);
  /** точная причина, почему полный режим недоступен в этом контексте */
  const blockReason = useMemo<FsBlockReason>(() => fsApiBlockReason(), []);

  const [phase, setPhase] = useState<Phase>("idle");
  const [pickerBlocked, setPickerBlocked] = useState(false);
  const [engine, setEngine] = useState<Engine>(supported ? "fs" : "fallback");
  const [canWrite, setCanWrite] = useState(true);
  const [folderName, setFolderName] = useState("");
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [scanErrors, setScanErrors] = useState<ScanError[]>([]);
  /** HEIC/HEIF пропущено (браузер не декодирует) — показываем честный баннер + FAQ */
  const [heicCount, setHeicCount] = useState(0);
  const [exact, setExact] = useState<DuplicateGroup[]>([]);
  const [similar, setSimilar] = useState<DuplicateGroup[]>([]);
  const [similarStats, setSimilarStats] = useState<SimilarStats | null>(null);
  const [progress, setProgress] = useState<Progress>({ done: 0, total: 0 });
  const [cancelled, setCancelled] = useState(false);
  const [fatal, setFatal] = useState(false);
  const [report, setReport] = useState<DeleteReport | null>(null);
  const [zipPct, setZipPct] = useState<number | null>(null);
  const [groupingBusy, setGroupingBusy] = useState(false);

  // параметры сканирования (герой) и выбора (результаты)
  // «Похожие» включены по умолчанию: визуально одинаковые картинки почти
  // никогда не совпадают побайтово (другое сжатие/формат/метаданные),
  // и без dHash пользователь видит «не найдено» при явных дублях.
  // Тогглы живут на лендинге (/), а скан — на /app: храним выбор в localStorage.
  const [recursive, setRecursiveState] = useState(() => readScanPrefs().recursive);
  const [findSimilar, setFindSimilarState] = useState(() => readScanPrefs().findSimilar);
  const [rule, setRule] = useState<KeepRule>("resolution");
  const [threshold, setThreshold] = useState(5);
  const [manualKeeps, setManualKeeps] = useState<Record<string, string>>({});

  const sourceRef = useRef<ScanSource>({ engine: "fs", root: null, raw: null });
  const abortRef = useRef<AbortController | null>(null);
  const poolRef = useRef<WorkerPool | null>(null);
  const filesRef = useRef<ImageFile[]>([]);
  const thresholdTimer = useRef<number | null>(null);
  /** актуальные параметры для execute — setState асинхронен, ref читается мгновенно */
  const cfgRef = useRef({ ...readScanPrefs(), threshold: 5 });

  function setRecursive(v: boolean) {
    cfgRef.current.recursive = v;
    setRecursiveState(v);
    writeScanPrefs({ recursive: v, findSimilar: cfgRef.current.findSimilar });
  }
  function setFindSimilar(v: boolean) {
    cfgRef.current.findSimilar = v;
    setFindSimilarState(v);
    writeScanPrefs({ recursive: cfgRef.current.recursive, findSimilar: v });
  }

  // ---------- конвейер сканирования ----------

  async function execute() {
    // Старт счётчика сети: покрывает выбор папки, демо и повторные сканы.
    privacyMeter.start();
    const src = sourceRef.current;
    const ac = new AbortController();
    abortRef.current = ac;
    const signal = ac.signal;
    const checkAbort = () => {
      if (signal.aborted) throw abortErr();
    };

    setCancelled(false);
    setFatal(false);
    setReport(null);
    setManualKeeps({});
    setExact([]);
    setSimilar([]);
    setSimilarStats(null);
    setScanErrors([]);
    setHeicCount(0);
    setFiles([]);
    filesRef.current = [];

    try {
      // 1) обход папки (только метаданные)
      setPhase("scanning");
      setProgress({ done: 0, total: 0 });
      let list: ImageFile[] = [];
      const errors: ScanError[] = [];
      let heic = 0;
      if (src.engine === "fs" && src.root) {
        const r = await scanDirectory(src.root, cfgRef.current.recursive, signal, (found) =>
          setProgress({ done: found, total: 0 })
        );
        list = r.files;
        errors.push(...r.errors);
        heic = r.skippedHeic;
      } else {
        const r = fromFallbackFiles(src.raw ?? [], cfgRef.current.recursive);
        list = r.files;
        heic = r.skippedHeic;
      }
      // 1.5) HEIC → JPEG: без конверсии браузер не декодирует пиксели для dHash.
      // Неудачи считаем отдельно — баннер честно скажет, что не прочиталось.
      heic = await convertHeicFiles(list, (d, t) => setProgress({ done: d, total: t }));
      filesRef.current = list;
      checkAbort();

      if (list.length > 0) {
        const pool = new WorkerPool(Math.min(4, Math.max(2, navigator.hardwareConcurrency || 4)));
        poolRef.current = pool;

        // 2) группировка по размеру → SHA-256 только для коллизий
        const collided = sizeCollisionCandidates(list);
        setPhase("hashing");
        setProgress({ done: 0, total: collided.length });
        let done = 0;
        await Promise.all(
          collided.map((f) =>
            pool
              .run({ kind: "hash", blob: f.blob })
              .then((out: WorkerOut) => {
                checkAbort();
                if (out.kind === "hash" && out.ok) f.sha256 = out.sha256;
                else {
                  f.broken = true;
                  errors.push({ path: f.path, reason: "hash" });
                }
              })
              .catch((e) => {
                if (signal.aborted) throw e;
                f.broken = true;
                errors.push({ path: f.path, reason: "hash" });
              })
              .finally(() => {
                done++;
                setProgress({ done, total: collided.length });
              })
          )
        );
        checkAbort();

        // 3) dHash: все файлы (похожие) или только члены групп (превью/размеры)
        const wantSimilar = cfgRef.current.findSimilar;
        const ex = exactGroups(list);
        const targets = wantSimilar ? list : filesInGroups(ex);
        setPhase(wantSimilar ? "dhashing" : "measuring");
        setProgress({ done: 0, total: targets.length });
        let ddone = 0;
        await Promise.all(
          targets.map((f) => {
            // HEIC без конверсии: dHash невозможен, но точный поиск по SHA уже посчитан —
            // файл не ломаем, просто пропускаем (баннер про HEIC покажет причину)
            if (isHeicName(f.name) && !f.decodedBlob) {
              ddone++;
              setProgress({ done: ddone, total: targets.length });
              return Promise.resolve();
            }
            return pool
              .run({ kind: "dhash", blob: f.decodedBlob ?? f.blob })
              .then((out: WorkerOut) => {
                checkAbort();
                if (out.kind === "dhash" && out.ok) {
                  f.dhashHi = out.hi;
                  f.dhashLo = out.lo;
                  f.width = out.width;
                  f.height = out.height;
                } else {
                  f.broken = true;
                  errors.push({ path: f.path, reason: "decode" });
                }
              })
              .catch((e) => {
                if (signal.aborted) throw e;
                f.broken = true;
                errors.push({ path: f.path, reason: "decode" });
              })
              .finally(() => {
                ddone++;
                setProgress({ done: ddone, total: targets.length });
              })
          })
        );
        checkAbort();
        pool.terminate();
        poolRef.current = null;

        // 4) группы
        setPhase("grouping");
        setProgress({ done: 0, total: 0 });
        setExact(exactGroups(list));
        if (wantSimilar) {
          const res = await runSimilarGrouping(list, cfgRef.current.threshold, (d, t) =>
            setProgress({ done: d, total: t })
          );
          checkAbort();
          setSimilar(res.groups);
          setSimilarStats(res.stats);
        }
      }

      setScanErrors(errors);
      setHeicCount(heic);
      setFiles([...list]);
      setPhase("results");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setCancelled(true);
      } else {
        setFatal(true);
      }
      setPhase("idle");
    } finally {
      abortRef.current = null;
      if (poolRef.current) {
        poolRef.current.terminate();
        poolRef.current = null;
      }
    }
  }

  async function pickAndScan() {
    setFatal(false);
    let picked;
    try {
      picked = await pickDirectory();
    } catch (e) {
      // Chrome блокирует picker в cross-origin iframe — покажем подсказку и фолбэк
      if (isPickerSecurityError(e)) setPickerBlocked(true);
      else setFatal(true);
      return;
    }
    if (!picked) return; // пользователь отменил диалог
    sourceRef.current = { engine: "fs", root: picked.handle, raw: null };
    setEngine("fs");
    setFolderName(picked.handle.name);
    setCanWrite(picked.canWrite);
    await execute();
  }

  async function pickAndScanFallback() {
    setFatal(false);
    const raw = await pickDirectoryFallback();
    if (!raw) return; // отмена
    sourceRef.current = { engine: "fallback", root: null, raw };
    setEngine("fallback");
    setFolderName("");
    setCanWrite(false);
    await execute();
  }

  /**
   * Демо-режим: 4 встроенные картинки (1 точная пара + 1 похожая пара).
   * Картинки зашиты в бандл как data-URI — ни одного fetch, демо работает
   * офлайн и под строгим CSP. Папка не нужна — запасной путь для мобильных.
   * Идёт через fallback-движок: поиск и ZIP работают, удаления нет (нечего удалять).
   */
  async function runDemo() {
    setFatal(false);
    setCancelled(false);
    setPhase("scanning");
    setProgress({ done: 0, total: 4 });
    try {
      const raw = loadDemoFiles();
      sourceRef.current = { engine: "fallback", root: null, raw };
      setEngine("fallback");
      setFolderName("Demo");
      setCanWrite(false);
      await execute();
    } catch {
      setFatal(true);
      setPhase("idle");
    }
  }

  async function rescan() {
    const src = sourceRef.current;
    if (src.engine === "fs" && src.root) {
      setCanWrite(await ensureWritePermission(src.root));
      await execute();
    } else if (src.raw) {
      await execute();
    } else {
      await pickAndScan();
    }
  }

  /** перезапуск с новыми опциями одним кликом (подсказки в пустых результатах) */
  async function rescanWith(overrides: { recursive?: boolean; findSimilar?: boolean }) {
    if (overrides.recursive !== undefined) setRecursive(overrides.recursive);
    if (overrides.findSimilar !== undefined) setFindSimilar(overrides.findSimilar);
    await rescan();
  }

  function cancelScan() {
    abortRef.current?.abort();
    poolRef.current?.terminate();
  }

  function reset() {
    cancelScan();
    setPhase("idle");
    setFiles([]);
    filesRef.current = [];
    setExact([]);
    setSimilar([]);
    setSimilarStats(null);
    setScanErrors([]);
    setHeicCount(0);
    setReport(null);
    setCancelled(false);
    setFatal(false);
    setManualKeeps({});
  }

  // ---------- выбор «кого оставить» ----------

  const allGroups = useMemo(() => [...exact, ...similar], [exact, similar]);

  const keepMap = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const g of allGroups) map.set(g.id, manualKeeps[g.id] ?? pickKeepId(g.files, rule));
    return map;
  }, [allGroups, manualKeeps, rule]);

  const candidates = useMemo(() => {
    const out: DeletionCandidate[] = [];
    for (const g of allGroups) {
      const keep = keepMap.get(g.id) ?? null;
      for (const f of g.files) {
        if (f.broken) continue;
        if (keep !== null && f.id === keep) continue;
        out.push({ file: f, groupId: g.id, kind: g.kind });
      }
    }
    return out;
  }, [allGroups, keepMap]);

  const candidateBytes = useMemo(
    () => candidates.reduce((s, c) => s + c.file.size, 0),
    [candidates]
  );

  function pickKeep(groupId: string, fileId: string) {
    setManualKeeps((prev) => ({ ...prev, [groupId]: fileId }));
  }

  function applyRule(r: KeepRule) {
    setRule(r);
    setManualKeeps({}); // смена правила сбрасывает ручной выбор
  }

  /** пересбор групп похожих по новому порогу — без повторного чтения файлов */
  function setThresholdLive(t: number) {
    setThreshold(t);
    cfgRef.current.threshold = t;
    const list = filesRef.current;
    if (!list.some((f) => f.dhashHi !== undefined)) return;
    if (thresholdTimer.current) window.clearTimeout(thresholdTimer.current);
    thresholdTimer.current = window.setTimeout(() => {
      setGroupingBusy(true);
      runSimilarGrouping(list, t)
        .then((res) => {
          setSimilar(res.groups);
          setSimilarStats(res.stats);
        })
        .catch(() => undefined)
        .finally(() => setGroupingBusy(false));
    }, 220);
  }

  // ---------- удаление / экспорт ----------

  async function confirmDeletion(items: DeletionCandidate[], mode: DeleteMode): Promise<boolean> {
    const root = sourceRef.current.root;
    if (!root || items.length === 0) return false;
    if (!(await ensureWritePermission(root))) {
      setCanWrite(false);
      return false;
    }
    setPhase("deleting");
    setProgress({ done: 0, total: items.length });
    const rep = await runDeletion(
      items.map((i) => i.file),
      mode,
      root,
      (done, total) => setProgress({ done, total })
    );
    setReport(rep);
    setPhase("report");
    return true;
  }

  /** «ZIP без дубликатов» — только запасной режим */
  async function downloadCleanZip() {
    if (zipPct !== null) return;
    const dropIds = new Set(candidates.map((c) => c.file.id));
    const keeps = filesRef.current.filter((f) => !f.broken && !dropIds.has(f.id));
    setZipPct(0);
    try {
      const blob = await buildCleanZip(keeps, setZipPct);
      downloadBlob("photos-without-duplicates.zip", blob);
    } catch {
      setFatal(true);
    } finally {
      setZipPct(null);
    }
  }

  async function copyDuplicateList(): Promise<boolean> {
    if (candidates.length === 0) return false;
    const lines: string[] = ["DupSweep — duplicate copies", ""];
    let current: string | null = null;
    for (const c of candidates) {
      if (c.groupId !== current) {
        current = c.groupId;
        lines.push("", `# ${c.kind} · ${c.groupId}`);
      }
      lines.push(`${c.file.path}  (${c.file.size} B)`);
    }
    return copyTextToClipboard(lines.join("\n"));
  }

  return {
    supported,
    blockReason,
    pickerBlocked,
    phase,
    engine,
    canWrite,
    folderName,
    files,
    scanErrors,
    heicCount,
    exact,
    similar,
    similarStats,
    allGroups,
    progress,
    cancelled,
    fatal,
    report,
    zipPct,
    groupingBusy,
    recursive,
    setRecursive,
    findSimilar,
    setFindSimilar,
    rule,
    applyRule,
    threshold,
    setThresholdLive,
    keepMap,
    candidates,
    candidateBytes,
    pickKeep,
    pickAndScan,
    pickAndScanFallback,
    runDemo,
    rescan,
    rescanWith,
    cancelScan,
    reset,
    confirmDeletion,
    downloadCleanZip,
    copyDuplicateList,
  };
}

export type Scanner = ReturnType<typeof useScanner>;
