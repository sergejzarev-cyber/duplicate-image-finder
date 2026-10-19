import { AlertTriangle, X } from "lucide-react";
import { useI18n } from "../i18n";
import { formatInt } from "../lib/format";
import type { Phase } from "../types";

const PHASE_KEYS: Partial<Record<Phase, string>> = {
  scanning: "scan.scanning",
  hashing: "scan.hashing",
  dhashing: "scan.dhashing",
  measuring: "scan.measuring",
  grouping: "scan.grouping",
  deleting: "scan.deleting",
};

export function Scanning(props: {
  phase: Phase;
  done: number;
  total: number;
  skipped: number;
  onCancel?: () => void;
}) {
  const { t, lang } = useI18n();
  const determinate = props.total > 0;
  const pct = determinate ? Math.min(100, Math.round((props.done / props.total) * 100)) : 0;

  return (
    <div
      className="mx-auto flex min-h-[68vh] max-w-2xl flex-col items-center justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="rise w-full rounded-3xl border border-stone-900/10 bg-white p-8 text-center shadow-[0_24px_70px_-30px_rgba(28,25,23,0.3)] sm:p-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-emerald-800">
          {t(PHASE_KEYS[props.phase] ?? "scan.scanning")}
        </p>

        <p className="mt-7 font-display text-6xl font-bold tabular-nums tracking-tight text-stone-950 sm:text-7xl">
          {formatInt(props.done, lang)}
          {determinate && (
            <span className="text-stone-300"> / {formatInt(props.total, lang)}</span>
          )}
        </p>
        {!determinate && <p className="mt-3 text-sm text-stone-500">{t("scan.found")}</p>}

        <div
          className="mt-8 h-1.5 overflow-hidden rounded-full bg-stone-900/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={determinate ? pct : undefined}
        >
          {determinate ? (
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-800 to-emerald-500 transition-[width] duration-150 ease-out"
              style={{ width: `${pct}%` }}
            />
          ) : (
            <div className="indet h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-stone-800 to-transparent" />
          )}
        </div>

        {props.skipped > 0 && (
          <p className="mt-4 flex items-center justify-center gap-1.5 font-mono text-xs font-medium text-amber-800">
            <AlertTriangle size={13} aria-hidden />
            {t("scan.skipped", { n: formatInt(props.skipped, lang) })}
          </p>
        )}

        <p className="mt-6 text-xs text-stone-500">{t("scan.wait")}</p>

        {props.onCancel && (
          <button
            type="button"
            onClick={props.onCancel}
            className="mx-auto mt-7 inline-flex items-center gap-2 rounded-xl border border-stone-900/15 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-red-600/40 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <X size={15} aria-hidden />
            {t("scan.cancel")}
          </button>
        )}
      </div>
    </div>
  );
}
