import { useEffect, useRef, useState } from "react";
import { AlertTriangle, FolderInput, Loader2, ShieldCheck, Trash2, X } from "lucide-react";
import { useI18n } from "../i18n";
import { formatBytes, formatInt } from "../lib/format";
import type { DeleteMode } from "../types";

export function DeleteDialog(props: {
  open: boolean;
  count: number;
  bytes: number;
  similarCount: number;
  working: boolean;
  progress: { done: number; total: number };
  onCancel: () => void;
  onConfirm: (mode: DeleteMode) => void;
}) {
  const { t, lang } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<DeleteMode>("move");
  const [ack, setAck] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (props.open && !d.open) d.showModal();
    if (!props.open && d.open) d.close();
  }, [props.open, props.working]);

  useEffect(() => {
    if (props.open) {
      setMode("move");
      setAck(false);
    }
  }, [props.open]);

  const n = formatInt(props.count, lang);
  const bytesStr = formatBytes(props.bytes, lang);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="dlg-title"
      onClose={() => {
        if (!props.working) props.onCancel();
      }}
      onCancel={(e) => {
        if (props.working) e.preventDefault();
      }}
    >
      <div className="p-6 sm:p-8">
        <h2 id="dlg-title" className="font-display text-2xl font-bold tracking-tight text-stone-950">
          {t("dlg.t")}
        </h2>
        <p className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-emerald-800">
          <ShieldCheck size={14} className="shrink-0" aria-hidden />
          {t("dlg.calm")}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-stone-900/10 bg-stone-950/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wider text-stone-500">{t("dlg.count")}</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-stone-950">{n}</p>
          </div>
          <div className="rounded-xl border border-stone-900/10 bg-stone-950/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wider text-stone-500">{t("dlg.bytes")}</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-emerald-800">
              {formatBytes(props.bytes, lang)}
            </p>
          </div>
        </div>

        {props.similarCount > 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-600/25 bg-amber-50 px-3 py-2.5 text-xs font-medium leading-relaxed text-amber-900">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
            {t("dlg.simWarn")}
          </p>
        )}

        {mode === "permanent" && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border border-red-600/30 bg-red-50 px-3 py-2.5"
          >
            <Trash2 size={14} className="mt-0.5 shrink-0 text-red-700" aria-hidden />
            <div>
              <p className="text-xs font-bold text-red-800">{t("dlg.permWarnT")}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-red-800/80">
                {t("dlg.permWarnD", { n, bytes: bytesStr })}
              </p>
            </div>
          </div>
        )}

        <fieldset className="mt-6" disabled={props.working}>
          <legend className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            {t("dlg.mode")}
          </legend>
          <div className="mt-3 space-y-2">
            {(
              [
                { value: "move" as const, icon: FolderInput, label: t("dlg.move"), hint: t("dlg.moveHint") },
                { value: "permanent" as const, icon: Trash2, label: t("dlg.perm"), hint: t("dlg.permHint") },
              ]
            ).map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-emerald-700 ${
                  mode === opt.value
                    ? opt.value === "move"
                      ? "border-emerald-700/50 bg-emerald-700/[0.06]"
                      : "border-red-600/50 bg-red-600/[0.05]"
                    : "border-stone-900/10 bg-stone-950/[0.015] hover:border-stone-900/25"
                }`}
              >
                <input
                  type="radio"
                  name="delete-mode"
                  className="sr-only"
                  checked={mode === opt.value}
                  onChange={() => {
                    setMode(opt.value);
                    // смена режима сбрасывает галочку: согласие на move ≠ согласие на permanent
                    setAck(false);
                  }}
                />
                <opt.icon
                  size={17}
                  aria-hidden
                  className={`mt-0.5 shrink-0 ${
                    mode === opt.value ? (opt.value === "move" ? "text-emerald-700" : "text-red-600") : "text-stone-400"
                  }`}
                />
                <span>
                  <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-stone-900">
                    {opt.label}
                    {opt.value === "move" && (
                      <span className="rounded-full bg-emerald-700/[0.08] px-2 py-px text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        {t("opt.simBadge")}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-stone-500">{opt.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label
          className={`mt-5 flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-emerald-700 ${
            ack ? "border-emerald-700/40 bg-emerald-700/[0.05]" : "border-stone-900/10 hover:border-stone-900/25"
          } ${props.working ? "pointer-events-none opacity-50" : ""}`}
        >
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-700"
            checked={ack}
            disabled={props.working}
            onChange={(e) => setAck(e.target.checked)}
          />
          <span className="text-sm leading-relaxed text-stone-700">
            {t(mode === "move" ? "dlg.checkMove" : "dlg.checkPerm", { n, bytes: bytesStr })}
          </span>
        </label>

        <p className="mt-6 text-center text-xs text-stone-500">{t("dlg.noRush")}</p>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            autoFocus
            onClick={props.onCancel}
            disabled={props.working}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-900/15 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-stone-900/35 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-40"
          >
            <X size={15} aria-hidden />
            {t("dlg.cancel")}
          </button>
          <button
            type="button"
            onClick={() => props.onConfirm(mode)}
            disabled={!ack || props.working || props.count === 0}
            className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40 ${
              mode === "move"
                ? "bg-emerald-700 shadow-[0_10px_30px_-10px_rgba(4,120,87,0.7)] hover:bg-emerald-600 focus-visible:ring-emerald-700"
                : "bg-red-600 shadow-[0_10px_30px_-10px_rgba(220,38,38,0.7)] hover:bg-red-500 focus-visible:ring-red-600"
            }`}
          >
            {props.working ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden />
                {t("dlg.working", { done: props.progress.done, total: props.progress.total })}
              </>
            ) : mode === "move" ? (
              <>
                <FolderInput size={15} aria-hidden />
                {t("dlg.confirmMove")}
              </>
            ) : (
              <>
                <Trash2 size={15} aria-hidden />
                {t("dlg.confirmPerm")}
              </>
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
}
