import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Crown,
  Download,
  Expand,
  FileWarning,
  Fingerprint,
  FolderOpen,
  Heart,
  House,
  ImageOff,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useI18n } from "../i18n";
import { formatBytes, formatDate, formatInt } from "../lib/format";
import { KEEP_RULES } from "../core/selection";
import {
  MAX_THRESHOLD,
  THRESHOLD_PRESETS,
  nearestPreset,
  pctBadgeClass,
  similarityPct,
} from "../core/similarity";
import { FREE_SIMILAR_GROUPS, splitByProLimit } from "../lib/pro";
import type { DuplicateGroup, ImageFile } from "../types";
import type { Scanner } from "../hooks/useScanner";
import { Crumbs, Steps } from "./Nav";
import { CompareDialog } from "./CompareDialog";
import { PrivacyBadge } from "./PrivacyBadge";
import { getDonateUrl } from "../lib/donate";

// ---------- миниатюра (objectURL живёт только пока видна карточка) ----------

function Thumb({ file }: { file: ImageFile }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const src = file.decodedBlob ?? file.blob;
  useEffect(() => {
    if (file.broken) return;
    setFailed(false);
    const u = URL.createObjectURL(src);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [src, file.broken]);

  if (file.broken || !url || failed) {
    return (
      <div className="grid h-full w-full place-items-center bg-stone-100">
        <ImageOff size={22} className="text-stone-300" aria-hidden />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}

// ---------- карточка файла (radio: «оставить этот») ----------

function FileCard(props: {
  file: ImageFile;
  group: DuplicateGroup;
  keepId: string | null;
  onKeep: (gid: string, fid: string) => void;
  /** дистанция Хэмминга до эталона (только для похожих) */
  dist?: number;
}) {
  const { t, lang } = useI18n();
  const { file, group, keepId } = props;
  const kept = keepId === file.id;
  const broken = Boolean(file.broken);
  const pct = props.dist === undefined ? null : similarityPct(props.dist);

  return (
    <label className={broken ? "block cursor-not-allowed" : "block cursor-pointer"}>
      <input
        type="radio"
        name={`keep-${group.id}`}
        className="peer sr-only"
        checked={kept}
        disabled={broken}
        onChange={() => props.onKeep(group.id, file.id)}
        aria-label={`${t("res.keep")}: ${file.name}`}
      />
      <div
        className={`overflow-hidden rounded-xl border bg-white transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-700 ${
          kept
            ? "border-emerald-600 shadow-[0_10px_30px_-12px_rgba(4,120,87,0.5)] ring-1 ring-emerald-600"
            : "border-stone-900/10 shadow-sm hover:border-stone-900/30"
        } ${broken ? "opacity-60" : ""}`}
      >
        <div className="relative aspect-[4/3] bg-stone-100">
          <Thumb file={file} />
          <span
            aria-hidden
            className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide shadow ${
              broken
                ? "bg-amber-500 text-white"
                : kept
                  ? "bg-emerald-600 text-white"
                  : "bg-red-600/95 text-white"
            }`}
          >
            {broken ? <ImageOff size={11} /> : kept ? <Check size={11} strokeWidth={3} /> : <Trash2 size={11} />}
            {broken ? t("res.broken") : kept ? t("res.keep") : t("res.remove")}
          </span>
          {!kept && !broken && <span aria-hidden className="absolute inset-0 bg-red-900/10" />}
          {pct !== null && !broken && (
            <span
              aria-hidden
              title={`Δ ${props.dist}`}
              className={`absolute left-2 top-2 rounded-full px-2 py-1 font-mono text-[10px] font-bold shadow ${pctBadgeClass(pct)}`}
            >
              {pct}%
            </span>
          )}
        </div>
        <div className="space-y-1 p-3">
          <p className="truncate text-xs font-semibold text-stone-900" title={file.name}>
            {file.name}
          </p>
          <p className="truncate font-mono text-[10px] text-stone-500" title={file.path}>
            {file.path}
          </p>
          <p className="font-mono text-[10px] leading-relaxed text-stone-500">
            {formatBytes(file.size, lang)}
            {file.width ? ` · ${file.width}×${file.height}` : ""}
            {` · ${formatDate(file.lastModified, lang)}`}
          </p>
        </div>
      </div>
    </label>
  );
}

// ---------- группа ----------

function GroupCard(props: {
  group: DuplicateGroup;
  index: number;
  keepId: string | null;
  onKeep: (gid: string, fid: string) => void;
  onCompare?: (group: DuplicateGroup) => void;
}) {
  const { t, tp, lang } = useI18n();
  const { group } = props;
  const exact = group.kind === "exact";
  const keepFile = group.files.find((f) => f.id === props.keepId);
  const matchPct = exact ? null : similarityPct(group.maxDist ?? 0);

  return (
    <article className="rise overflow-hidden rounded-2xl border border-stone-900/10 bg-white shadow-[0_18px_50px_-24px_rgba(28,25,23,0.3)]">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-stone-900/8 bg-stone-950/[0.015] px-4 py-3.5 sm:px-5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
            exact
              ? "border-emerald-700/30 bg-emerald-700/[0.07] text-emerald-800"
              : "border-amber-600/30 bg-amber-500/[0.08] text-amber-800"
          }`}
        >
          {exact ? <Fingerprint size={12} aria-hidden /> : <Sparkles size={12} aria-hidden />}
          {props.index}
        </span>
        <h4 className="text-sm font-semibold text-stone-900">
          {tp("files", group.files.length)}
          <span className="ml-2 font-normal text-stone-500">
            {exact
              ? t("res.each", { size: formatBytes(group.bytesEach, lang) })
              : t("res.match", { pct: matchPct ?? 100 })}
          </span>
          {!exact && (
            <span className="ml-1.5 font-mono text-[10px] font-normal text-stone-400" title="Hamming">
              ({t("res.dist", { n: group.maxDist ?? 0 })})
            </span>
          )}
        </h4>
        {group.hash && (
          <code className="rounded bg-stone-900/5 px-1.5 py-0.5 font-mono text-[10px] text-stone-500">
            {group.hash.slice(0, 16)}…
          </code>
        )}
        {!exact && props.onCompare && (
          <button
            type="button"
            onClick={() => props.onCompare?.(group)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-amber-600/30 bg-amber-500/[0.08] px-2.5 py-1.5 text-[11px] font-semibold text-amber-900 transition-colors hover:bg-amber-500/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
          >
            <Expand size={12} aria-hidden />
            {t("res.compare")}
          </button>
        )}
        {keepFile && (
          <span
            className={`${!exact && props.onCompare ? "" : "ml-auto "}hidden max-w-[38%] truncate font-mono text-[11px] text-stone-500 sm:inline`}
            title={keepFile.path}
          >
            {t("res.keep")}: <span className="font-semibold text-emerald-800">{keepFile.name}</span>
          </span>
        )}
      </header>
      <div
        role="radiogroup"
        aria-label={t("res.groupAria", { n: props.index })}
        className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        {group.files.map((f, i) => (
          <FileCard
            key={f.id}
            file={f}
            group={group}
            keepId={props.keepId}
            onKeep={props.onKeep}
            dist={exact ? undefined : group.dists?.[i]}
          />
        ))}
      </div>
    </article>
  );
}

// ---------- экран результатов ----------

export function Results({
  s,
  onOpenDelete,
  onHome,
}: {
  s: Scanner;
  onOpenDelete: () => void;
  onHome: () => void;
}) {
  const { t, tp, lang } = useI18n();
  const [copied, setCopied] = useState(false);
  const [compareGroup, setCompareGroup] = useState<DuplicateGroup | null>(null);

  const candCount = s.candidates.length;
  // секция «похожие» имеет смысл только если dHash посчитан для всех файлов
  const similarAvailable = useMemo(
    () => s.findSimilar && s.files.some((f) => f.dhashHi !== undefined),
    [s.findSimilar, s.files]
  );
  const similarCount = s.similar.length;
  const { visible: similarVisible, locked: similarLocked } = useMemo(
    () => splitByProLimit(s.similar, FREE_SIMILAR_GROUPS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.similar]
  );
  const activePreset = nearestPreset(s.threshold);

  // диагностика пустого результата: есть ли вообще совпадения по размеру (кандидаты в точные дубли)
  const sizeCollisionCount = useMemo(() => {
    const m = new Map<number, number>();
    for (const f of s.files) m.set(f.size, (m.get(f.size) ?? 0) + 1);
    let c = 0;
    for (const v of m.values()) if (v > 1) c += v;
    return c;
  }, [s.files]);

  const onCopy = async () => {
    if (await s.copyDuplicateList()) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  };

  const ghostBtn =
    "inline-flex items-center gap-2 rounded-xl border border-stone-900/15 bg-white px-4 py-2.5 text-xs font-semibold text-stone-600 shadow-sm transition-colors hover:border-stone-900/35 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700";

  return (
    <div className="mx-auto max-w-6xl px-4 pb-48 pt-8 sm:px-6">
      <Crumbs current={t("res.title")} onHome={onHome} />

      <div className="mb-6">
        <PrivacyBadge />
      </div>

      {/* баннеры режима */}
      {s.engine === "fs" && !s.canWrite && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-600/25 bg-amber-50 px-5 py-4 shadow-sm">
          <AlertTriangle size={16} className="text-amber-700" aria-hidden />
          <p className="flex-1 text-sm font-medium text-amber-900">{t("bar.readonly")}</p>
          <button
            type="button"
            onClick={s.pickAndScan}
            className="rounded-lg border border-amber-700/40 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            {t("bar.repick")}
          </button>
        </div>
      )}
      {s.engine === "fallback" && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-stone-900/10 bg-white px-5 py-4 shadow-sm">
          <AlertTriangle size={16} className="mt-0.5 text-amber-700" aria-hidden />
          <p className="text-sm leading-relaxed text-stone-600">{t("hero.unsup.d")}</p>
        </div>
      )}
      {s.folderName === "_duplicates" && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-sky-700/25 bg-sky-50 px-5 py-4 shadow-sm">
          <FolderOpen size={16} className="mt-0.5 shrink-0 text-sky-800" aria-hidden />
          <div>
            <p className="text-sm font-bold text-sky-950">{t("res.quar.t")}</p>
            <p className="mt-1 text-sm leading-relaxed text-sky-950/80">{t("res.quar.d")}</p>
          </div>
        </div>
      )}
      {s.heicCount > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-600/25 bg-amber-50 px-5 py-4 shadow-sm">
          <ImageOff size={16} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
          <div>
            <p className="text-sm font-bold text-amber-900">{t("res.heic.t", { n: s.heicCount })}</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-900/80">{t("res.heic.d")}</p>
          </div>
        </div>
      )}

      {/* шапка */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
            {t("res.title")}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {s.folderName && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/25 bg-emerald-700/[0.06] px-2.5 py-1 font-mono text-xs font-medium text-emerald-900">
                <FolderOpen size={12} className="shrink-0 text-emerald-800" aria-hidden />
                <span className="max-w-64 truncate">{s.folderName}</span>
              </span>
            )}
            <span className="rounded-lg border border-stone-900/10 bg-white px-2.5 py-1 font-mono text-xs text-stone-500 shadow-sm">
              {t("res.checked")}: {tp("files", s.files.length)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Steps current={2} />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onHome} className={ghostBtn}>
              <House size={14} aria-hidden />
              {t("nav.home")}
            </button>
            <button type="button" onClick={s.rescan} className={ghostBtn}>
              <RefreshCw size={14} aria-hidden />
              {t("res.rescan")}
            </button>
            <button
              type="button"
              onClick={s.supported ? s.pickAndScan : s.pickAndScanFallback}
              className={ghostBtn}
            >
              <FolderOpen size={14} aria-hidden />
              {t("res.newScan")}
            </button>
          </div>
        </div>
      </div>

      {/* спокойствие: пока ничего не удалено */}
      {s.allGroups.length > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-700/20 bg-emerald-50/60 px-5 py-4">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden />
          <div>
            <p className="text-sm font-bold text-stone-900">{t("res.calm.t")}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-stone-600">{t("res.calm.d")}</p>
          </div>
        </div>
      )}

      {/* статистика */}
      <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-red-700/15 bg-red-50 p-4 shadow-sm sm:p-5">
          <p className="font-display text-3xl font-bold tabular-nums tracking-tight text-red-700 sm:text-5xl">
            {formatInt(candCount, lang)}
          </p>
          <p className="mt-1.5 text-[11px] uppercase tracking-wider text-stone-500">{t("res.stat.remove")}</p>
        </div>
        <div className="rounded-2xl border border-emerald-700/15 bg-emerald-50 p-4 shadow-sm sm:p-5">
          <p className="font-display text-3xl font-bold tabular-nums tracking-tight text-emerald-800 sm:text-5xl">
            {formatBytes(s.candidateBytes, lang)}
          </p>
          <p className="mt-1.5 text-[11px] uppercase tracking-wider text-stone-500">{t("res.stat.free")}</p>
        </div>
        <div className="rounded-2xl border border-stone-900/10 bg-white p-4 shadow-sm sm:p-5">
          <p className="font-display text-3xl font-bold tabular-nums tracking-tight text-stone-950 sm:text-5xl">
            {formatInt(s.allGroups.length, lang)}
          </p>
          <p className="mt-1.5 text-[11px] uppercase tracking-wider text-stone-500">{t("res.stat.groups")}</p>
        </div>
      </div>

      {/* донат после пользы: человек уже видит, сколько освободит */}
      {s.candidateBytes > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl border border-amber-600/25 bg-gradient-to-r from-amber-50 via-white to-amber-50 px-5 py-3.5 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <Heart size={15} className="shrink-0 text-amber-600" aria-hidden />
            {t("donate.results.t", { freed: formatBytes(s.candidateBytes, lang) })}
          </p>
          <a
            href={getDonateUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-950 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <Heart size={12} aria-hidden />
            {t("donate.report.btn")}
          </a>
        </div>
      )}

      {s.allGroups.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <label className="flex items-center gap-2 text-xs font-medium text-stone-600">
            {t("opt.rule")}
            <span className="relative">
              <select
                value={s.rule}
                onChange={(e) => s.applyRule(e.target.value as typeof s.rule)}
                className="appearance-none rounded-lg border border-stone-900/15 bg-white py-2 pl-3 pr-8 text-xs font-medium text-stone-900 shadow-sm transition-colors hover:border-stone-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                {KEEP_RULES.map((r) => (
                  <option key={r} value={r}>
                    {t(`rule.${r}`)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                aria-hidden
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500"
              />
            </span>
          </label>
          <p className="text-xs text-stone-500">{t("res.ruleHint")}</p>
        </div>
      )}

      {/* пусто */}
      {s.allGroups.length === 0 && (
        <div className="rise mt-10 rounded-3xl border border-stone-900/10 bg-white p-12 text-center shadow-[0_24px_70px_-30px_rgba(28,25,23,0.3)]">
          {s.files.length === 0 ? (
            <>
              <ImageOff size={40} className="mx-auto text-stone-300" aria-hidden />
              <h3 className="mt-4 font-display text-2xl font-bold text-stone-950">{t("res.nofiles.t")}</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500">
                {t("res.nofiles.d")}
              </p>
              {!s.recursive && (
                <button
                  type="button"
                  onClick={() => s.rescanWith({ recursive: true })}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-700/50 bg-emerald-700/[0.06] px-5 py-2.5 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-700/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                >
                  <FolderOpen size={15} aria-hidden />
                  {t("res.nofiles.btn")}
                </button>
              )}
            </>
          ) : (
            <>
              <CheckCircle2 size={40} className="mx-auto text-emerald-600" aria-hidden />
              <h3 className="mt-4 font-display text-2xl font-bold text-stone-950">{t("res.empty.t")}</h3>
              <p className="mt-2 text-sm text-stone-500">{t("res.empty.d")}</p>

              {/* сводка: что именно проверено */}
              <dl className="mx-auto mt-6 grid max-w-lg grid-cols-2 gap-2 text-left">
                <div className="rounded-xl border border-stone-900/10 bg-stone-950/[0.02] p-3">
                  <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-stone-500">
                    <Fingerprint size={12} aria-hidden className="text-emerald-800" />
                    {t("res.empty.exactRow")}
                  </dt>
                  <dd className="mt-1 font-display text-xl font-bold tabular-nums text-stone-950">0</dd>
                </div>
                <div className="rounded-xl border border-stone-900/10 bg-stone-950/[0.02] p-3">
                  <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-stone-500">
                    <Sparkles size={12} aria-hidden className="text-amber-700" />
                    {t("res.empty.simRow")}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-stone-700">
                    {s.findSimilar ? t("res.empty.simNone", { n: s.threshold }) : t("res.empty.simOff")}
                  </dd>
                </div>
                <div className="rounded-xl border border-stone-900/10 bg-stone-950/[0.02] p-3">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-stone-500">
                    {t("res.empty.filesRow")}
                  </dt>
                  <dd className="mt-1 font-display text-xl font-bold tabular-nums text-stone-950">
                    {formatInt(s.files.length, lang)}
                  </dd>
                </div>
                <div className="rounded-xl border border-stone-900/10 bg-stone-950/[0.02] p-3">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-stone-500">
                    {t("res.empty.sizeRow")}
                  </dt>
                  <dd className="mt-1 font-display text-xl font-bold tabular-nums text-stone-950">
                    {formatInt(sizeCollisionCount, lang)}
                  </dd>
                </div>
              </dl>

              {/* действия-исправления в один клик */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {!s.findSimilar && (
                  <button
                    type="button"
                    onClick={() => s.rescanWith({ findSimilar: true })}
                    className="inline-flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-10px_rgba(28,25,23,0.7)] transition-all hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    <Sparkles size={15} aria-hidden />
                    {t("res.empty.similar.btn")}
                  </button>
                )}
                {!s.recursive && (
                  <button
                    type="button"
                    onClick={() => s.rescanWith({ recursive: true })}
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-900/20 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition-colors hover:border-stone-900/40 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                  >
                    <FolderOpen size={15} aria-hidden />
                    {t("res.empty.recBtn")}
                  </button>
                )}
              </div>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-stone-500">
                {!s.findSimilar ? t("res.empty.similar.hint") : t("res.empty.thrHint")}
              </p>

              {/* почему так получилось */}
              <details className="mx-auto mt-8 max-w-lg rounded-2xl border border-stone-900/10 bg-stone-950/[0.015] text-left">
                <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 text-sm font-semibold text-stone-700 transition-colors hover:text-stone-950">
                  <AlertTriangle size={15} className="shrink-0 text-amber-700" aria-hidden />
                  {t("res.empty.whyT")}
                </summary>
                <ol className="list-decimal space-y-2.5 border-t border-stone-900/10 px-5 py-4 pl-10 text-[13px] leading-relaxed text-stone-600">
                  <li>{t("res.empty.why1")}</li>
                  <li>{t("res.empty.why2")}</li>
                  <li>{t("res.empty.why3")}</li>
                </ol>
              </details>

              {/* какие файлы реально проверены */}
              <details className="mx-auto mt-3 max-w-lg rounded-2xl border border-stone-900/10 bg-stone-950/[0.015] text-left">
                <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 text-sm font-semibold text-stone-700 transition-colors hover:text-stone-950">
                  <FileWarning size={15} className="shrink-0 text-stone-400" aria-hidden />
                  {t("res.empty.filesT")} ({formatInt(s.files.length, lang)})
                </summary>
                <div className="border-t border-stone-900/10 px-5 py-4">
                  <p className="text-xs text-stone-500">
                    {t("res.empty.filesNote", {
                      n: Math.min(60, s.files.length),
                      total: formatInt(s.files.length, lang),
                    })}
                  </p>
                  <ul className="mt-3 max-h-56 space-y-1 overflow-auto pr-2">
                    {s.files.slice(0, 60).map((f) => (
                      <li
                        key={f.id}
                        className="flex items-baseline justify-between gap-3 font-mono text-[11px]"
                      >
                        <span className="min-w-0 truncate text-stone-700" title={f.path}>
                          {f.path}
                        </span>
                        <span className="shrink-0 text-stone-400">
                          {formatBytes(f.size, lang)}
                          {f.width ? ` · ${f.width}×${f.height}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            </>
          )}
        </div>
      )}

      {/* точные дубликаты */}
      {s.exact.length > 0 && (
        <section className="mt-10">
          <h3 className="flex items-center gap-2 text-base font-semibold text-stone-950">
            <Fingerprint size={17} className="text-emerald-800" aria-hidden />
            {t("res.exact")}
            <span className="font-mono text-xs font-normal text-stone-500">
              ({formatInt(s.exact.length, lang)})
            </span>
          </h3>
          <div className="mt-4 space-y-5">
            {s.exact.map((g, i) => (
              <GroupCard
                key={g.id}
                group={g}
                index={i + 1}
                keepId={s.keepMap.get(g.id) ?? null}
                onKeep={s.pickKeep}
              />
            ))}
          </div>
        </section>
      )}

      {/* похожие — Similar v2 */}
      {similarAvailable && (
        <section className="mt-12">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <h3 className="flex items-center gap-2 text-base font-semibold text-stone-950">
              <Sparkles size={17} className="text-amber-700" aria-hidden />
              {t("res.similar")}
              <span className="font-mono text-xs font-normal text-stone-500">
                ({formatInt(similarCount, lang)})
              </span>
              {s.groupingBusy && <Loader2 size={14} className="animate-spin text-stone-400" aria-hidden />}
            </h3>
            <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-xs font-medium text-stone-600">{t("res.presetLabel")}:</span>
              <div role="group" aria-label={t("res.presetLabel")} className="flex gap-1.5">
                {THRESHOLD_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => s.setThresholdLive(p.value)}
                    aria-pressed={activePreset === p.id}
                    className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${
                      activePreset === p.id
                        ? "border-amber-600 bg-amber-500/15 text-amber-900"
                        : "border-stone-900/10 bg-white text-stone-500 hover:border-stone-900/30 hover:text-stone-900"
                    }`}
                  >
                    {t(`res.preset.${p.id}`)}
                  </button>
                ))}
              </div>
              <label htmlFor="threshold" className="sr-only">
                {t("res.threshold")}
              </label>
              <input
                id="threshold"
                type="range"
                min={0}
                max={MAX_THRESHOLD}
                step={1}
                value={s.threshold}
                aria-valuetext={`≤ ${s.threshold}`}
                title={t("res.threshold")}
                onChange={(e) => s.setThresholdLive(Number(e.target.value))}
                className="range w-28 sm:w-36"
                style={{ ["--fill" as string]: `${(s.threshold / MAX_THRESHOLD) * 100}%` }}
              />
              <span className="min-w-9 rounded-md bg-amber-500/10 px-1.5 py-1 text-center font-mono text-xs font-bold text-amber-800">
                ≤{s.threshold}
              </span>
            </div>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs font-medium leading-relaxed text-amber-800">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />
            {t("res.similarWarn")}
          </p>
          {similarCount > 0 ? (
            <div className="mt-4 space-y-5">
              {similarVisible.map((g, i) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  index={i + 1}
                  keepId={s.keepMap.get(g.id) ?? null}
                  onKeep={s.pickKeep}
                  onCompare={setCompareGroup}
                />
              ))}
              {similarLocked > 0 && (
                <div className="rise overflow-hidden rounded-2xl border border-amber-600/30 bg-gradient-to-br from-amber-50 to-white p-6 text-center shadow-sm">
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-amber-500/15 text-amber-800">
                    <Crown size={18} aria-hidden />
                  </span>
                  <p className="mt-3 text-sm font-bold text-stone-900">
                    <span className="mr-1.5 rounded bg-stone-950 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                      {t("pro.badge")}
                    </span>
                    {t("pro.simTitle", { n: similarLocked })}
                  </p>
                  <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-stone-500">
                    {t("pro.simDesc", {
                      shown: FREE_SIMILAR_GROUPS,
                      total: similarCount,
                    })}
                  </p>
                  <a
                    href="/feedback"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    <Crown size={13} aria-hidden />
                    {t("pro.simBtn")}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-stone-900/8 bg-white px-4 py-3 shadow-sm">
              <p className="text-sm text-stone-500">{t("res.similarNone")}</p>
              {s.similarStats && s.similarStats.minDist >= 0 && s.similarStats.minPair && (
                <div className="mt-3 border-t border-stone-900/8 pt-3">
                  <p className="font-mono text-[11px] leading-relaxed text-stone-600">
                    {t("res.simClosest", {
                      a: s.files[s.similarStats.minPair[0]]?.name ?? "?",
                      b: s.files[s.similarStats.minPair[1]]?.name ?? "?",
                      d: s.similarStats.minDist,
                      pct: similarityPct(s.similarStats.minDist),
                    })}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-stone-400">
                    {t("res.simChecked", { n: formatInt(s.similarStats.pairsChecked, lang) })}
                  </p>
                  {s.similarStats.minDist > s.threshold && s.similarStats.minDist <= MAX_THRESHOLD ? (
                    <button
                      type="button"
                      onClick={() => s.setThresholdLive(s.similarStats!.minDist)}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-amber-600/40 bg-amber-500/[0.08] px-3 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-500/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
                    >
                      <Sparkles size={13} aria-hidden />
                      {t("res.simRaise", { n: s.similarStats.minDist })}
                    </button>
                  ) : (
                    s.similarStats.minDist > MAX_THRESHOLD && (
                      <p className="mt-2 text-xs leading-relaxed text-stone-500">
                        {t("res.simTooFar", { max: MAX_THRESHOLD })}
                      </p>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* пропущенные */}
      {s.scanErrors.length > 0 && (
        <details className="mt-10 rounded-2xl border border-stone-900/10 bg-white shadow-sm">
          <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 text-sm font-medium text-stone-700 transition-colors hover:text-stone-950">
            <FileWarning size={15} className="text-amber-700" aria-hidden />
            {t("res.errors", { n: formatInt(s.scanErrors.length, lang) })}
          </summary>
          <div className="border-t border-stone-900/10 px-5 py-4">
            <p className="text-xs text-stone-500">{t("res.errorsHint")}</p>
            <ul className="mt-3 max-h-48 space-y-1 overflow-auto pr-2">
              {s.scanErrors.map((e, i) => (
                <li key={i} className="font-mono text-[11px] text-stone-600">
                  {e.path} <span className="text-stone-400">({e.reason})</span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}

      {/* нижняя панель действий */}
      <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
        <div className="flex w-full max-w-3xl flex-wrap items-center gap-3 rounded-2xl border border-stone-900/10 bg-white/92 px-4 py-3 shadow-[0_24px_60px_-16px_rgba(28,25,23,0.4)] backdrop-blur-xl">
          {s.engine === "fs" ? (
            <>
              <p className="min-w-0 flex-1 text-sm text-stone-500">
                {candCount > 0 ? (
                  <>
                    <span className="font-semibold text-stone-950">{tp("files", candCount)}</span>
                    <span className="text-stone-400"> · {formatBytes(s.candidateBytes, lang)}</span>
                  </>
                ) : (
                  t("bar.nothing")
                )}
              </p>
              <button
                type="button"
                onClick={onOpenDelete}
                disabled={candCount === 0 || !s.canWrite}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_28px_-10px_rgba(220,38,38,0.7)] transition-all hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={15} aria-hidden />
                {t("bar.delete")}
              </button>
            </>
          ) : (
            <>
              <p className="min-w-0 flex-1 text-sm text-stone-500">
                {candCount > 0 ? (
                  <>
                    <span className="font-semibold text-stone-950">{tp("files", candCount)}</span>
                    <span className="text-stone-400"> · {formatBytes(s.candidateBytes, lang)}</span>
                  </>
                ) : (
                  t("bar.nothing")
                )}
              </p>
              {copied && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <Check size={13} aria-hidden />
                  {t("bar.copied")}
                </span>
              )}
              <button
                type="button"
                onClick={onCopy}
                disabled={candCount === 0}
                className={ghostBtn}
              >
                <Copy size={14} aria-hidden />
                {t("bar.copy")}
              </button>
              <button
                type="button"
                onClick={s.downloadCleanZip}
                disabled={s.zipPct !== null || s.files.length - candCount === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_28px_-10px_rgba(28,25,23,0.7)] transition-all hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {s.zipPct !== null ? (
                  <>
                    <Loader2 size={14} className="animate-spin" aria-hidden />
                    {t("bar.zipping", { n: s.zipPct })}
                  </>
                ) : (
                  <>
                    <Download size={14} aria-hidden />
                    {t("bar.zip")}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* модалка сравнения похожих */}
      {compareGroup && (
        <CompareDialog
          group={compareGroup}
          index={s.similar.findIndex((g) => g.id === compareGroup.id) + 1}
          keepId={s.keepMap.get(compareGroup.id) ?? null}
          onKeep={s.pickKeep}
          onClose={() => setCompareGroup(null)}
        />
      )}
    </div>
  );
}
