import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type {
  ImageFile,
  DuplicateGroup,
  ScanProgress,
  RemoveReport,
  SelectionRule,
  DeletionMode,
  ScanDiagnostics,
} from './types';
import { collectFiles, filesFromFileList } from './fs/scanner';
import { openDirectoryPicker, checkFileSystemAccess } from './fs/access';
import { buildExactGroups, buildSimilarGroups, recommendKeep, similarityLabel, debugSimilarPairs } from './core/duplicates';
import { computeImageFingerprints } from './core/imageHash';
import { useI18n } from './i18n/useI18n';
import JSZip from 'jszip';
import {
  FolderOpen,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Home,
  Heart,
  Play,
  ShieldCheck,
} from 'lucide-react';
import { DONATE_URL } from './config';
import { PrivacyBadge } from './ui/PrivacyBadge';
import { privacyMeter } from './privacy/privacy-meter';
import { SendToDesktop } from './ui/SendToDesktop';

type AppState = 'idle' | 'scanning' | 'results' | 'deleting' | 'report';

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString();
}

function createWorker(): Worker {
  return new Worker(new URL('./worker/hash.worker.ts', import.meta.url), { type: 'module' });
}

async function sha256Main(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function fingerprintsMain(buffer: ArrayBuffer) {
  return computeImageFingerprints(buffer);
}

export default function ScannerApp() {
  const { lang, setLang, t, languages } = useI18n();
  const [state, setState] = useState<AppState>('idle');
  const [mode, setMode] = useState<'fs' | 'fallback'>('fs');
  const [includeSubfolders, setIncludeSubfolders] = useState(true);
  const [enableSimilar, setEnableSimilar] = useState(true);
  const [hammingThreshold, setHammingThreshold] = useState(12);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | undefined>();
  const [folderName, setFolderName] = useState('');
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [exactGroups, setExactGroups] = useState<DuplicateGroup[]>([]);
  const [similarGroups, setSimilarGroups] = useState<DuplicateGroup[]>([]);
  const [selectionRule, setSelectionRule] = useState<SelectionRule>('largest-resolution');
  const [deletionMode, setDeletionMode] = useState<DeletionMode>('move-to-subfolder');
  const [progress, setProgress] = useState<ScanProgress>({
    phase: 'collect',
    processed: 0,
    total: 0,
  });
  const [diagnostics, setDiagnostics] = useState<ScanDiagnostics | null>(null);
  const [report, setReport] = useState<RemoveReport | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [fsSupported, setFsSupported] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [demoKeepLeft, setDemoKeepLeft] = useState(true);
  const workerRef = useRef<Worker | null>(null);
  const scanSignal = useRef<AbortController | null>(null);
  const cancelRef = useRef(false);
  const thumbUrls = useRef<Map<string, string>>(new Map());
  const handleTryDemoRef = useRef<null | (() => Promise<void>)>(null);

  useEffect(() => {
    try {
      workerRef.current = createWorker();
    } catch (e) {
      console.warn('Worker init failed', e);
      workerRef.current = null;
    }
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    setIsMobile(mobile);
    const ok = checkFileSystemAccess() && window.isSecureContext;
    setFsSupported(ok);
    if (!ok) setMode('fallback');

    // Landing "Demo" deep-link: /app?demo=1
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1') {
      // delay until handlers ready
      setTimeout(() => {
        void handleTryDemoRef.current?.();
      }, 50);
    }

    return () => {
      workerRef.current?.terminate();
      for (const url of thumbUrls.current.values()) URL.revokeObjectURL(url);
      thumbUrls.current.clear();
    };
  }, []);

  const getThumb = useCallback((f: ImageFile) => {
    if (!f.file) return null;
    let url = thumbUrls.current.get(f.id);
    if (!url) {
      url = URL.createObjectURL(f.file);
      thumbUrls.current.set(f.id, url);
    }
    return url;
  }, []);

  const handleReset = useCallback(() => {
    setState('idle');
    setFiles([]);
    setExactGroups([]);
    setSimilarGroups([]);
    setDirHandle(undefined);
    setFolderName('');
    setProgress({ phase: 'collect', processed: 0, total: 0 });
    setDiagnostics(null);
    setReport(null);
    cancelRef.current = false;
    setShowConfirm(false);
    setStatusNote('');
    setMode('fs');
    for (const url of thumbUrls.current.values()) URL.revokeObjectURL(url);
    thumbUrls.current.clear();
  }, []);

  const handleChooseFolder = useCallback(async () => {
    try {
      privacyMeter.start();
      const res = await openDirectoryPicker(includeSubfolders);
      if (res.dirHandle) {
        setDirHandle(res.dirHandle);
        setFolderName(res.dirHandle.name);
        setMode('fs');
        setStatusNote('');
        return res.dirHandle;
      }
      if (res.error) {
        setMode('fallback');
        setStatusNote(t('fallbackNote'));
      }
      return undefined;
    } catch (e: unknown) {
      console.error(e);
      setMode('fallback');
      setStatusNote(t('fallbackNote'));
      return undefined;
    }
  }, [includeSubfolders, t]);

  const analyzeFile = useCallback(
    async (
      file: ImageFile,
      buffer: ArrayBuffer,
      computeDhash: boolean
    ): Promise<Partial<ImageFile>> => {
      const fallback = async (): Promise<Partial<ImageFile>> => {
        const sha256 = await sha256Main(buffer);
        const extra: Partial<ImageFile> = { sha256 };
        if (computeDhash) {
          try {
            Object.assign(extra, await fingerprintsMain(buffer));
          } catch {
            extra.broken = true;
            extra.error = 'broken image';
          }
        }
        return extra;
      };

      const worker = workerRef.current;
      if (!worker) return fallback();

      return new Promise((resolve) => {
        const timeout = window.setTimeout(() => {
          worker.removeEventListener('message', onMsg);
          void fallback().then(resolve);
        }, 20000);

        const onMsg = (e: MessageEvent) => {
          const msg = e.data;
          if (msg.type === 'result' && msg.id === file.id) {
            window.clearTimeout(timeout);
            worker.removeEventListener('message', onMsg);
            resolve({
              sha256: msg.sha256,
              dhash: msg.dhash,
              phash: msg.phash,
              width: msg.width,
              height: msg.height,
              broken: msg.broken,
              error: msg.error,
            });
          } else if (msg.type === 'error' && msg.id === file.id) {
            window.clearTimeout(timeout);
            worker.removeEventListener('message', onMsg);
            void fallback().then(resolve);
          }
        };

        worker.addEventListener('message', onMsg);
        try {
          const copy = buffer.slice(0);
          worker.postMessage(
            {
              type: 'analyze',
              id: file.id,
              path: file.relativePath,
              buffer: copy,
              computeDhash,
            },
            [copy]
          );
        } catch {
          window.clearTimeout(timeout);
          worker.removeEventListener('message', onMsg);
          void fallback().then(resolve);
        }
      });
    },
    []
  );

  const runScan = useCallback(
    async (fileList?: ImageFile[], handleOverride?: FileSystemDirectoryHandle) => {
      setState('scanning');
      cancelRef.current = false;
      setExactGroups([]);
      setSimilarGroups([]);
      setReport(null);
      setStatusNote('');
      scanSignal.current = new AbortController();

      const currentHandle = handleOverride ?? dirHandle;
      let list: ImageFile[] = fileList ?? files;

      setProgress({ phase: 'collect', processed: 0, total: 0, message: t('scanning') });

      if (currentHandle && !fileList) {
        try {
          list = await collectFiles(currentHandle, includeSubfolders, scanSignal.current.signal);
          setFiles(list);
          setFolderName(currentHandle.name);
        } catch (e: unknown) {
          setStatusNote('Scan error: ' + (e instanceof Error ? e.message : String(e)));
          setState('idle');
          return;
        }
      }

      if (cancelRef.current) {
        setState('idle');
        return;
      }

      if (list.length === 0) {
        setDiagnostics({
          totalFiles: 0,
          sizeCollisionGroups: 0,
          filesHashed: 0,
          exactGroups: 0,
          similarGroups: 0,
          uniqueSizes: 0,
        });
        setState('results');
        return;
      }

      setProgress({
        phase: 'hash',
        processed: 0,
        total: list.length,
        message: t('findingDuplicates'),
      });

      const enriched: ImageFile[] = [];
      for (let i = 0; i < list.length; i++) {
        if (cancelRef.current || scanSignal.current?.signal.aborted) {
          setState('idle');
          return;
        }
        const f = { ...list[i] };
        setProgress({
          phase: enableSimilar ? 'phash' : 'hash',
          processed: i,
          total: list.length,
          currentFile: f.name,
          message: t('findingDuplicates'),
        });

        try {
          let fileObj = f.file;
          if (!fileObj && f.handle) fileObj = await f.handle.getFile();
          if (!fileObj) {
            enriched.push({ ...f, error: 'unreadable' });
            continue;
          }
          const buffer = await fileObj.arrayBuffer();
          const meta = await analyzeFile(f, buffer, enableSimilar);
          enriched.push({ ...f, file: fileObj, ...meta });
        } catch (err: unknown) {
          enriched.push({
            ...f,
            broken: true,
            error: err instanceof Error ? err.message : 'error',
          });
        }
      }

      setFiles(enriched);

      const byHash = new Map<string, ImageFile[]>();
      for (const f of enriched) {
        if (!f.sha256) continue;
        const arr = byHash.get(f.sha256) ?? [];
        arr.push(f);
        byHash.set(f.sha256, arr);
      }
      const exact = buildExactGroups(byHash, selectionRule);

      const inExact = new Set<string>();
      for (const g of exact) for (const f of g.files) inExact.add(f.id);

      let similar: DuplicateGroup[] = [];
      if (enableSimilar) {
        const candidates = enriched.filter(
          (f) => (f.dhash || f.phash) && !inExact.has(f.id) && !f.broken
        );
        similar = buildSimilarGroups(candidates, hammingThreshold, selectionRule);
        // Helpful diagnostics in DevTools
        const pairs = debugSimilarPairs(candidates, 30);
        console.log(
          '[similar] threshold=',
          hammingThreshold,
          'candidates=',
          candidates.length,
          'groups=',
          similar.length
        );
        console.log('[similar] pairwise distances:\n' + pairs.join('\n'));
      }

      const sizeCount = new Map<number, number>();
      for (const f of enriched) sizeCount.set(f.size, (sizeCount.get(f.size) ?? 0) + 1);
      const sizeCollisionGroups = [...sizeCount.values()].filter((c) => c > 1).length;

      setExactGroups(exact);
      setSimilarGroups(similar);
      setDiagnostics({
        totalFiles: enriched.length,
        sizeCollisionGroups,
        filesHashed: enriched.filter((f) => f.sha256).length,
        exactGroups: exact.length,
        similarGroups: similar.length,
        uniqueSizes: sizeCount.size,
      });
      setProgress({ phase: 'done', processed: enriched.length, total: enriched.length });
      setState('results');
    },
    [
      files,
      dirHandle,
      includeSubfolders,
      selectionRule,
      enableSimilar,
      hammingThreshold,
      t,
      analyzeFile,
    ]
  );

  const handleFallbackInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = Array.from(e.target.files ?? []);
      const imageFileObjs = filesFromFileList(list);
      if (imageFileObjs.length === 0) return;
      const firstPath = (list[0] as File & { webkitRelativePath?: string }).webkitRelativePath;
      setFolderName(firstPath?.split('/')[0] ?? t('folderSelected'));
      setFiles(imageFileObjs);
      setMode('fallback');
      await runScan(imageFileObjs);
    },
    [runScan, t]
  );

  const handleTryDemo = useCallback(async () => {
    try {
      privacyMeter.start();
      // CSP-safe demo: generate images in-memory (no fetch)
      const makeShot = (w: number, h: number, quality: number, label: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#1e3a5f');
        g.addColorStop(0.5, '#3b82f6');
        g.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.ellipse(w * 0.35, h * 0.4, w * 0.18, h * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${Math.floor(w / 18)}px sans-serif`;
        ctx.fillText(label, w * 0.08, h * 0.85);
        return new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/jpeg', quality);
        });
      };
      const [a, b] = await Promise.all([makeShot(1200, 800, 0.92, 'A'), makeShot(640, 427, 0.4, 'A')]);
      const f1 = new File([a], 'demo-original.jpg', { type: 'image/jpeg' });
      const f2 = new File([b], 'demo-small.jpg', { type: 'image/jpeg' });
      const objs = filesFromFileList([f1, f2]);
      setFolderName('Demo');
      setFiles(objs);
      setEnableSimilar(true);
      await runScan(objs);
    } catch (e) {
      console.error(e);
      setStatusNote('Demo could not be created.');
    }
  }, [runScan]);

  handleTryDemoRef.current = handleTryDemo;

  const performDeletion = useCallback(
    async (toProcess: DuplicateGroup[]) => {
      setState('deleting');
      const errors: string[] = [];
      const removedFiles: string[] = [];
      let freedBytes = 0;
      let removedCount = 0;

      let duplicatesDir: FileSystemDirectoryHandle | null = null;
      if (mode === 'fs' && deletionMode === 'move-to-subfolder' && dirHandle) {
        try {
          duplicatesDir = await (
            dirHandle as unknown as {
              getDirectoryHandle: (
                n: string,
                o: { create: boolean }
              ) => Promise<FileSystemDirectoryHandle>;
            }
          ).getDirectoryHandle('_duplicates', { create: true });
        } catch (e: unknown) {
          errors.push(
            'Cannot create _duplicates: ' + (e instanceof Error ? e.message : String(e))
          );
        }
      }

      for (const group of toProcess) {
        const keepFile = group.recommendation ?? group.files[0];
        for (const f of group.files) {
          if (f === keepFile) continue;
          try {
            if (mode !== 'fs' || !f.handle) {
              errors.push((mode === 'fallback' ? 'Fallback: ' : 'No handle: ') + f.name);
              continue;
            }

            if (deletionMode === 'move-to-subfolder' && duplicatesDir) {
              try {
                const fileData = await f.handle.getFile();
                const dest = await (
                  duplicatesDir as unknown as {
                    getFileHandle: (
                      n: string,
                      o: { create: boolean }
                    ) => Promise<FileSystemFileHandle>;
                  }
                ).getFileHandle(f.name, { create: true });
                const writable = await (
                  dest as unknown as {
                    createWritable: () => Promise<FileSystemWritableFileStream>;
                  }
                ).createWritable();
                await writable.write(fileData);
                await writable.close();

                const removable = f.handle as unknown as { remove?: () => Promise<void> };
                if (removable.remove) await removable.remove();
                else
                  await (
                    dirHandle as unknown as { removeEntry: (n: string) => Promise<void> }
                  ).removeEntry(f.name);

                removedFiles.push(f.relativePath);
                removedCount++;
                freedBytes += f.size;
                continue;
              } catch (e: unknown) {
                errors.push(
                  'Move failed ' + f.name + ': ' + (e instanceof Error ? e.message : String(e))
                );
              }
            }

            const removable = f.handle as unknown as { remove?: () => Promise<void> };
            if (removable.remove) {
              await removable.remove();
              removedFiles.push(f.relativePath);
              removedCount++;
              freedBytes += f.size;
            } else if (dirHandle) {
              await (
                dirHandle as unknown as { removeEntry: (n: string) => Promise<void> }
              ).removeEntry(f.name);
              removedFiles.push(f.relativePath);
              removedCount++;
              freedBytes += f.size;
            } else {
              errors.push('Delete not supported for ' + f.name);
            }
          } catch (e: unknown) {
            errors.push(f.name + ': ' + (e instanceof Error ? e.message : String(e)));
          }
        }
      }

      setReport({ removedCount, freedBytes, errors, removedFiles });
      setExactGroups([]);
      setSimilarGroups([]);
      setState('report');
      setShowConfirm(false);
    },
    [mode, deletionMode, dirHandle]
  );

  const handleDownloadZip = useCallback(async () => {
    const zip = new JSZip();
    const keepers = new Map<string, ImageFile>();
    const dupPaths = new Set<string>();
    const all = [...exactGroups, ...similarGroups];
    for (const group of all) {
      for (const f of group.files) dupPaths.add(f.relativePath);
      keepers.set((group.recommendation ?? group.files[0]).relativePath, group.recommendation ?? group.files[0]);
    }
    for (const f of files) {
      if (!dupPaths.has(f.relativePath)) keepers.set(f.relativePath, f);
    }
    for (const [path, fileObj] of keepers.entries()) {
      try {
        const blob = fileObj.file ?? (fileObj.handle ? await fileObj.handle.getFile() : null);
        if (blob) zip.file(path, blob);
      } catch (e) {
        console.error(e);
      }
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'images_without_duplicates.zip';
    a.click();
    URL.revokeObjectURL(url);
  }, [exactGroups, similarGroups, files]);

  const handleSetKeepGroup = useCallback(
    (type: 'exact' | 'similar', groupIndex: number, fileIndex: number) => {
      const setter = type === 'exact' ? setExactGroups : setSimilarGroups;
      setter((prev) => {
        const next = [...prev];
        const group = next[groupIndex];
        const fileToKeep = group.files[fileIndex];
        next[groupIndex] = {
          ...group,
          files: [fileToKeep, ...group.files.filter((f) => f !== fileToKeep)],
          recommendation: fileToKeep,
        };
        return next;
      });
    },
    []
  );

  const allGroups = useMemo(() => [...exactGroups, ...similarGroups], [exactGroups, similarGroups]);
  const totalToDelete = useMemo(
    () => allGroups.reduce((sum, g) => sum + Math.max(0, g.files.length - 1), 0),
    [allGroups]
  );
  const totalSizeToDelete = useMemo(
    () =>
      allGroups.reduce((sum, g) => {
        const keep = g.recommendation ?? g.files[0];
        return sum + g.files.filter((f) => f !== keep).reduce((s, f) => s + f.size, 0);
      }, 0),
    [allGroups]
  );

  const stepIndex =
    state === 'idle' ? 0 : state === 'scanning' ? 1 : state === 'results' || state === 'deleting' ? 2 : 3;
  const steps = [t('step1'), t('step2'), t('step3'), t('step4')];

  return (
    <div className="app-shell min-h-screen text-slate-900">
      <header className="header-bar sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <button
            type="button"
            onClick={handleReset}
            className="group flex items-center gap-3 rounded-2xl px-1 py-1 text-left transition hover:bg-white/70"
            aria-label={t('backHome')}
          >
            <div className="logo-mark flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-sky-500 text-white shadow-lg shadow-blue-700/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-slate-900">{t('brand')}</div>
              <div className="text-[11px] font-medium text-slate-700">{t('privacyBadge')}</div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <a
              href="/feedback"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              {t('feedback')}
            </a>
            <a
              href="/verify"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-900 sm:inline-flex"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('verifyNav')}
            </a>
            <div className="flex rounded-full border border-slate-300 bg-white p-1 shadow-sm">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                    lang === l.code ? 'bg-slate-900 text-white' : 'text-slate-700 hover:text-slate-900'
                  }`}
                  aria-label={l.label}
                >
                  {l.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <nav className="mb-8 flex flex-wrap items-center gap-2 anim-rise" aria-label="Progress">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-8 items-center gap-2 rounded-full px-3 text-xs font-semibold shadow-sm ${
                  i <= stepIndex
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 bg-white/90 text-slate-600'
                }`}
              >
                <span className="opacity-70">{i + 1}</span>
                {label}
              </div>
              {i < steps.length - 1 && <div className="hidden h-px w-6 bg-stone-300 sm:block" />}
            </div>
          ))}
        </nav>

        {state === 'idle' && (
          <div className="space-y-8">
            <section className="glass anim-rise overflow-hidden rounded-[28px] p-7 md:p-10">
              <div className="grid items-center gap-8 md:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl md:leading-[1.08]">
                    {t('heroTitle')}
                  </h1>
                  <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-700">
                    {t('heroText')}
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    {mode === 'fallback' ? (
                      <label className="btn-accent inline-flex cursor-pointer items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold">
                        <FolderOpen className="h-4 w-4" />
                        {t('fallbackSelect')}
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          {...({ webkitdirectory: '', directory: '' } as any)}
                          onChange={handleFallbackInput}
                        />
                      </label>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          const handle = await handleChooseFolder();
                          if (handle) await runScan(undefined, handle);
                        }}
                        className="btn-accent inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
                      >
                        <FolderOpen className="h-4 w-4" />
                        {t('chooseFolder')}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleTryDemo}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                    >
                      <Play className="h-4 w-4 text-blue-700" />
                      {t('tryDemo')}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                      <input
                        type="checkbox"
                        checked={includeSubfolders}
                        onChange={(e) => setIncludeSubfolders(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-400 text-blue-700 focus:ring-blue-600"
                      />
                      {t('includeSubfolders')}
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-800" title="dHash / perceptual hash">
                      <input
                        type="checkbox"
                        checked={enableSimilar}
                        onChange={(e) => setEnableSimilar(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-400 text-blue-700 focus:ring-blue-600"
                      />
                      {t('similarEnabled')}
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{t('tryDemoHint')}</p>

                  {statusNote && (
                    <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/95 px-4 py-3 text-sm text-amber-900">
                      {statusNote}
                    </p>
                  )}

                  {(isMobile || !fsSupported) && (
                    <>
                      <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                        <div className="font-semibold">{isMobile ? t('mobileFallbackTitle') : t('browserNoteTitle')}</div>
                        <p className="mt-1 leading-relaxed">{isMobile ? t('mobileFallbackText') : t('supportedBrowsers')}</p>
                      </div>
                      <SendToDesktop t={t} />
                    </>
                  )}
                </div>

                <div className="relative anim-rise-delay-1">
                  <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-violet-300/20 to-sky-200/15 blur-2xl" />
                  <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-xl shadow-slate-900/10">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-800">
                        {t('demoBadge')}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                        98% {t('demoSimilar')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDemoKeepLeft(true)}
                        className={`overflow-hidden rounded-2xl border-2 bg-slate-100 text-left transition ${
                          demoKeepLeft ? 'border-emerald-400' : 'border-slate-200'
                        }`}
                      >
                        <img
                          src="/images/demo-pair-base.jpg"
                          alt="Demo original"
                          className="h-28 w-full object-cover"
                        />
                        <div className={`border-t px-3 py-2 ${demoKeepLeft ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
                          <div className="text-[11px] font-semibold text-slate-800">demo-original.jpg</div>
                          <div className="text-[10px] text-slate-700">{t('demoLarger')}</div>
                          <div
                            className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                              demoKeepLeft ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {demoKeepLeft ? t('demoKeep') : t('demoRemove')}
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDemoKeepLeft(false)}
                        className={`overflow-hidden rounded-2xl border-2 bg-slate-50 text-left transition ${
                          !demoKeepLeft ? 'border-emerald-400' : 'border-slate-200'
                        }`}
                      >
                        <img
                          src="/images/demo-pair-base.jpg"
                          alt="Demo compressed preview"
                          className="h-28 w-full object-cover opacity-90"
                          style={{ filter: 'contrast(0.95) saturate(0.92)' }}
                        />
                        <div className={`border-t px-3 py-2 ${!demoKeepLeft ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
                          <div className="text-[11px] font-semibold text-slate-800">demo-small.jpg</div>
                          <div className="text-[10px] text-slate-700">{t('demoSmaller')}</div>
                          <div
                            className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                              !demoKeepLeft ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {!demoKeepLeft ? t('demoKeep') : t('demoRemove')}
                          </div>
                        </div>
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-600">{t('demoRuleHint')}</p>
                    <div className="mt-3">
                      <div className="mb-2 text-xs font-semibold text-slate-800">{t('recommendationsTitle')}</div>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            ['largest-resolution', t('recommendLargest')],
                            ['newest', t('recommendNewest')],
                            ['oldest', t('recommendOldest')],
                            ['shortest-name', t('recommendShortestName')],
                          ] as const
                        ).map(([key, label]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setSelectionRule(key);
                              // Demo pair: largest/newest => left original; shortest-name/oldest => right small name feel
                              setDemoKeepLeft(key === 'largest-resolution' || key === 'newest');
                            }}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                              selectionRule === key
                                ? 'bg-slate-900 text-white'
                                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SEO / trust content below the fold */}
            <section className="grid gap-4 lg:grid-cols-5">
              <div className="card-soft rounded-3xl p-5 lg:col-span-2">
                <div className="text-sm font-semibold text-slate-900">{t('seoHowTitle')}</div>
                <div className="mt-4 space-y-3">
                  {[t('seoHow1'), t('seoHow2'), t('seoHow3')].map((text, i) => (
                    <div key={text} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                        {i + 1}
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card-soft rounded-3xl p-5 lg:col-span-3">
                <div className="text-sm font-semibold text-slate-900">{t('seoFaqTitle')}</div>
                <div className="mt-3 space-y-3">
                  {(
                    [
                      ['seoFaq1q', 'seoFaq1a'],
                      ['seoFaq2q', 'seoFaq2a'],
                      ['seoFaq3q', 'seoFaq3a'],
                      ['seoFaq4q', 'seoFaq4a'],
                      ['seoFaq5q', 'seoFaq5a'],
                    ] as const
                  ).map(([q, a]) => (
                    <div key={q}>
                      <div className="text-sm font-semibold text-slate-900">{t(q)}</div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700">{t(a)}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-600">
                  {t('seoOpenSource')}{' '}
                  <a
                    className="font-semibold text-blue-700 underline"
                    href="https://github.com/sergejzarev-cyber/duplicate-image-finder"
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub
                  </a>
                </p>
              </div>
            </section>
          </div>
        )}

        {state === 'scanning' && (
          <section className="glass rounded-[28px] p-8 md:p-10">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
                  {t('scanning')}
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  {folderName && `${t('folderSelected')}: ${folderName}`}
                  {progress.currentFile ? ` · ${progress.currentFile}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  cancelRef.current = true;
                }}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                {t('cancel')}
              </button>
            </div>
            <div className="mb-2 flex justify-between text-xs font-medium text-stone-500">
              <span>{progress.message ?? t('findingDuplicates')}</span>
              <span>
                {progress.processed} {t('ofTotal')} {progress.total}
              </span>
            </div>
            <div className="progress-track h-3">
              <div
                className="progress-fill"
                style={{
                  width: `${
                    progress.total
                      ? Math.min(100, (progress.processed / progress.total) * 100)
                      : 8
                  }%`,
                }}
              />
            </div>
          </section>
        )}

        {state === 'results' && (
          <div className="space-y-6">
            <section className="rounded-3xl border border-sky-200 bg-sky-50/90 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{t('resultCalmTitle')}</div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{t('resultCalmText')}</p>
                </div>
                <PrivacyBadge t={t} />
              </div>
            </section>

            <section className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  {t('exactDuplicates')}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {folderName && `${t('folderSelected')}: ${folderName} · `}
                  {diagnostics?.totalFiles ?? files.length} {t('files')} · {exactGroups.length}{' '}
                  {t('groups')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  <Home className="h-4 w-4" />
                  {t('backHome')}
                </button>
                <button
                  type="button"
                  onClick={() => runScan()}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t('scanAgain')}
                </button>
              </div>
            </section>

            <section className="card-soft rounded-[24px] p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
                {t('recommendationsTitle')}
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['largest-resolution', t('recommendLargest')],
                    ['oldest', t('recommendOldest')],
                    ['newest', t('recommendNewest')],
                    ['shortest-name', t('recommendShortestName')],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectionRule(key);
                      setExactGroups((prev) =>
                        prev.map((g) => ({ ...g, recommendation: recommendKeep(g.files, key) }))
                      );
                      setSimilarGroups((prev) =>
                        prev.map((g) => ({ ...g, recommendation: recommendKeep(g.files, key) }))
                      );
                    }}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      selectionRule === key
                        ? 'bg-stone-900 text-white'
                        : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {enableSimilar && (
              <section className="card-soft rounded-[24px] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{t('similarImages')}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      {t('similarThreshold')}: ≤ {hammingThreshold}
                    </div>
                    <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-600">{t('similarHint')}</p>
                  </div>
                  <label className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="text-xs font-medium text-slate-400">{t('similarStrict')}</span>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={hammingThreshold}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setHammingThreshold(v);
                        const inExact = new Set<string>();
                        for (const g of exactGroups) for (const f of g.files) inExact.add(f.id);
                        const candidates = files.filter(
                          (f) => (f.dhash || f.phash) && !inExact.has(f.id) && !f.broken
                        );
                        setSimilarGroups(buildSimilarGroups(candidates, v, selectionRule));
                      }}
                      className="w-44 accent-blue-600"
                    />
                    <span className="text-xs font-medium text-slate-400">{t('similarLoose')}</span>
                    <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                      ≤{hammingThreshold}
                    </span>
                  </label>
                </div>
                {similarGroups.length === 0 && exactGroups.length >= 0 && (
                  <p className="mt-3 text-xs text-amber-800">{t('similarEmpty')}</p>
                )}
              </section>
            )}

            {exactGroups.length === 0 && similarGroups.length === 0 ? (
              <section className="glass rounded-[28px] px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-semibold text-stone-900">{t('noDuplicates')}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">{t('noDuplicatesHint')}</p>
                {diagnostics && (
                  <p className="mx-auto mt-3 max-w-lg text-xs text-amber-800">
                    Diagnose: files={diagnostics.totalFiles}, unique sizes={diagnostics.uniqueSizes},
                    same-size groups={diagnostics.sizeCollisionGroups}, hashed=
                    {diagnostics.filesHashed}
                  </p>
                )}
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t('backHome')}
                  </button>
                </div>
              </section>
            ) : (
              <>
                {exactGroups.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-stone-900">
                      {t('exactDuplicates')}{' '}
                      <span className="text-stone-400">({exactGroups.length})</span>
                    </h3>
                    {exactGroups.map((group, idx) => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        idx={idx}
                        t={t}
                        getThumb={getThumb}
                        onKeep={(fi) => handleSetKeepGroup('exact', idx, fi)}
                      />
                    ))}
                  </div>
                )}

                {similarGroups.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900">
                      {t('similarImages')}{' '}
                      <span className="text-slate-400">({similarGroups.length})</span>
                    </h3>
                    <p className="text-xs text-amber-800">⚠ {t('similarReview')}</p>
                    {similarGroups.map((group, idx) => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        idx={idx}
                        t={t}
                        getThumb={getThumb}
                        onKeep={(fi) => handleSetKeepGroup('similar', idx, fi)}
                        similarity={similarityLabel(group.maxDistance, hammingThreshold)}
                      />
                    ))}
                  </div>
                )}

                <section className="glass sticky bottom-4 rounded-[24px] p-5 shadow-2xl shadow-stone-900/10">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-stone-900">{t('deleteSummary')}</h3>
                      <p className="text-sm text-stone-500">
                        {t('filesToDelete', { count: totalToDelete })} ·{' '}
                        {t('totalSize', { size: fmtBytes(totalSizeToDelete) })}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">
                        <input
                          type="radio"
                          checked={deletionMode === 'delete'}
                          onChange={() => setDeletionMode('delete')}
                        />
                        {t('deleteModeDelete')}
                      </label>
                      <label className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">
                        <input
                          type="radio"
                          checked={deletionMode === 'move-to-subfolder'}
                          onChange={() => setDeletionMode('move-to-subfolder')}
                        />
                        {t('deleteModeMove')}
                      </label>
                      {mode === 'fallback' ? (
                        <button
                          type="button"
                          onClick={handleDownloadZip}
                          className="btn-accent rounded-xl px-4 py-2.5 text-sm font-semibold"
                        >
                          {t('zipButton')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowConfirm(true)}
                          className="btn-danger rounded-xl px-4 py-2.5 text-sm font-semibold"
                        >
                          {t('confirmDelete')}
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {state === 'report' && report && (
          <section className="glass rounded-[28px] p-7 md:p-10">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-stone-900">
                    {t('reportTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">{t('subtitle')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
              >
                <Home className="h-4 w-4" />
                {t('newScan')}
              </button>
            </div>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-100 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  {t('removed')}
                </div>
                <div className="mt-2 text-3xl font-semibold text-stone-900">{report.removedCount}</div>
              </div>
              <div className="rounded-2xl border border-stone-100 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  {t('freedSpace')}
                </div>
                <div className="mt-2 text-3xl font-semibold text-emerald-700">
                  {fmtBytes(report.freedBytes)}
                </div>
              </div>
              <div className="rounded-2xl border border-stone-100 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  {t('errors')}
                </div>
                <div className="mt-2 text-3xl font-semibold text-rose-700">{report.errors.length}</div>
              </div>
            </div>
            {report.errors.length > 0 && (
              <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 p-4">
                <ul className="space-y-2 text-sm text-rose-800">
                  {report.errors.map((err, i) => (
                    <li key={i} className="flex gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {Boolean(DONATE_URL?.trim()) && (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-white p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{t('supportAfterResult')}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {t('freedSpace')}: <span className="font-semibold text-emerald-700">{fmtBytes(report.freedBytes)}</span>
                    </div>
                  </div>
                  <a
                    href={DONATE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
                  >
                    <Heart className="h-4 w-4" />
                    {t('support')}
                  </a>
                </div>
              </div>
            )}

            <div className="mb-4">
              <PrivacyBadge t={t} />
            </div>

            <a href="/" className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold">
              <Home className="h-4 w-4" />
              {t('backHome')}
            </a>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-200/80 bg-white/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-slate-900">
            <a href="/" className="hover:text-blue-700">{t('backHome')}</a>
            <a href="/verify" target="_blank" rel="noopener noreferrer" className="hover:text-blue-700">
              {t('verifyNav')}
            </a>
            <a href="/feedback" target="_blank" rel="noopener noreferrer" className="hover:text-blue-700">
              {t('feedback')}
            </a>
            {Boolean(DONATE_URL?.trim()) && (
              <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" className="text-rose-800 hover:text-rose-900">
                {t('footerSupport')}
              </a>
            )}
          </div>
          <div className="text-xs font-semibold text-slate-800">© {new Date().getFullYear()} DupSweep · /app</div>
        </div>
      </footer>

      {showConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white p-7 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full ${
                  deletionMode === 'delete' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                }`}
              >
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                {deletionMode === 'delete' ? t('permanentDeleteTitle') : t('deleteConfirm')}
              </h3>
            </div>
            <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">
                {t('filesToDelete', { count: totalToDelete })}
              </p>
              <p className="mt-1">{t('totalSize', { size: fmtBytes(totalSizeToDelete) })}</p>
              <p className="mt-2 text-xs text-slate-600">
                {deletionMode === 'delete' ? t('deleteModeDelete') : t('deleteModeMove')}
              </p>
            </div>
            {deletionMode === 'delete' && (
              <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-relaxed text-rose-900">
                {t('permanentDeleteWarn')}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => performDeletion(allGroups)}
                className={`flex-1 rounded-2xl py-3 text-sm font-semibold text-white ${
                  deletionMode === 'delete' ? 'btn-danger' : 'btn-accent'
                }`}
              >
                {t('confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupCard({
  group,
  idx,
  t,
  getThumb,
  onKeep,
  similarity,
}: {
  group: DuplicateGroup;
  idx: number;
  t: (k: string) => string;
  getThumb: (f: ImageFile) => string | null;
  onKeep: (fileIndex: number) => void;
  similarity?: string;
}) {
  const simText =
    similarity === 'very-close'
      ? t('similarVeryClose')
      : similarity === 'close'
        ? t('similarClose')
        : similarity === 'loose'
          ? t('similarLooseMatch')
          : '';

  return (
    <article className="card-soft overflow-hidden rounded-[24px]">
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              group.type === 'similar' ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {idx + 1}
          </span>
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {group.files.length} {t('files')}
              {group.maxDistance != null ? ` · ≤ ${group.maxDistance}` : ''}
              {simText ? ` · ${simText}` : ''}
            </div>
            <div className="font-mono text-[11px] text-slate-400">{group.hash.slice(0, 20)}…</div>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-medium ${
            group.type === 'similar' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {group.type === 'exact' ? t('exactDuplicates') : t('similarImages')}
        </span>
      </div>
      <div className="space-y-3 p-4 md:p-5">
        {group.files.map((f, fidx) => {
          const isKeep = (group.recommendation ?? group.files[0]) === f;
          const thumb = getThumb(f);
          return (
            <div
              key={f.id}
              className={`flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center ${
                isKeep ? 'border-emerald-200 bg-emerald-50/70' : 'border-stone-100 bg-white'
              }`}
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                {thumb ? (
                  <img src={thumb} alt={f.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-stone-300">
                    <ImageIcon className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="truncate text-sm font-semibold text-stone-900">{f.name}</h4>
                  {isKeep && (
                    <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      {t('keepLabel')}
                    </span>
                  )}
                </div>
                <div className="mt-1 grid gap-1 text-xs text-stone-500 sm:grid-cols-3">
                  <span className="truncate">{f.relativePath}</span>
                  <span>
                    {fmtBytes(f.size)}
                    {f.width && f.height ? ` · ${f.width}×${f.height}` : ''}
                  </span>
                  <span>{fmtDate(f.lastModified)}</span>
                </div>
              </div>
              {!isKeep && (
                <button
                  type="button"
                  onClick={() => onKeep(fidx)}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                >
                  {t('keepThis')}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}
