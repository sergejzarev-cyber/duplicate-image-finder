import { AlertTriangle, ArrowRight, CheckCircle2, FileWarning, Heart, House, RefreshCw } from "lucide-react";
import { useI18n } from "../i18n";
import { formatBytes, formatInt } from "../lib/format";
import { getDonateUrl } from "../lib/donate";
import type { DeleteReport } from "../types";
import { Crumbs, Steps } from "./Nav";

export function Report(props: {
  report: DeleteReport;
  onAgain: () => void;
  onRescan: () => void;
  onHome: () => void;
}) {
  const { t, lang } = useI18n();
  const { t: _t } = useI18n();
  void _t;
  const r = props.report;
  const ok = r.errors.length === 0;
  const mainCount = r.mode === "move" ? r.moved : r.deleted;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-8 sm:px-6">
      <Crumbs current={t(r.mode === "move" ? "rep.t.move" : "rep.t.perm")} onHome={props.onHome} />
      <div className="rise rounded-3xl border border-stone-900/10 bg-white p-8 text-center shadow-[0_24px_70px_-30px_rgba(28,25,23,0.3)] sm:p-12">
        <div className="flex justify-center">
          <Steps current={3} />
        </div>
        {ok ? (
          <CheckCircle2 size={44} className="mx-auto mt-7 text-emerald-600" aria-hidden />
        ) : (
          <AlertTriangle size={44} className="mx-auto mt-7 text-amber-600" aria-hidden />
        )}
        <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
          {t(r.mode === "move" ? "rep.t.move" : "rep.t.perm")}
        </h2>
        <p className="mt-2 text-sm text-stone-500">{ok ? t("rep.ok") : t("res.errorsHint")}</p>
        {r.mode === "move" && r.moved > 0 && (
          <p className="mt-1 text-sm text-stone-500">{t("rep.moveHint")}</p>
        )}

        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-stone-900/10 bg-stone-950/[0.02] p-4">
            <p className="font-display text-2xl font-bold tabular-nums text-stone-950 sm:text-3xl">
              {formatInt(mainCount, lang)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-stone-500">
              {t(r.mode === "move" ? "rep.moved" : "rep.deleted")}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-700/20 bg-emerald-700/[0.06] p-4">
            <p className="font-display text-2xl font-bold tabular-nums text-emerald-800 sm:text-3xl">
              {formatBytes(r.freed, lang)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-stone-500">{t("rep.freed")}</p>
          </div>
          <div className="rounded-xl border border-stone-900/10 bg-stone-950/[0.02] p-4">
            <p
              className={`font-display text-2xl font-bold tabular-nums sm:text-3xl ${
                r.errors.length ? "text-amber-700" : "text-stone-950"
              }`}
            >
              {formatInt(r.errors.length, lang)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-stone-500">
              {t("rep.errorsShort")}
            </p>
          </div>
        </div>

        {r.errors.length > 0 && (
          <details className="mt-6 rounded-xl border border-amber-600/25 bg-amber-50 text-left">
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-amber-900">
              <FileWarning size={15} aria-hidden />
              {t("rep.errors", { n: r.errors.length })}
            </summary>
            <ul className="max-h-44 space-y-1 overflow-auto border-t border-amber-600/15 px-4 py-3">
              {r.errors.map((e, i) => (
                <li key={i} className="font-mono text-[11px] text-amber-900/80">
                  {e.path} <span className="text-amber-800/50">({e.reason})</span>
                </li>
              ))}
            </ul>
          </details>
        )}

        {mainCount > 0 && (
          <div className="mt-8 rounded-2xl border border-amber-600/25 bg-gradient-to-br from-amber-50 to-white p-5 text-center">
            <Heart size={20} className="mx-auto text-amber-600" aria-hidden />
            <p className="mt-2 text-sm font-bold text-stone-900">
              {t("donate.report.t", { freed: formatBytes(r.freed, lang) })}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-stone-500">
              {t("donate.report.d")}
            </p>
            <a
              href={getDonateUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-600/40 bg-white px-4 py-2 text-xs font-bold text-amber-900 shadow-sm transition-colors hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            >
              <Heart size={13} aria-hidden />
              {t("donate.report.btn")}
            </a>
          </div>
        )}

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={props.onAgain}
            className="inline-flex items-center gap-2 rounded-2xl bg-stone-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_-14px_rgba(28,25,23,0.55)] transition-all hover:-translate-y-0.5 hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {t("rep.again")}
            <ArrowRight size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={props.onRescan}
            className="inline-flex items-center gap-2 rounded-2xl border border-stone-900/15 bg-white px-6 py-3 text-sm font-medium text-stone-600 shadow-sm transition-colors hover:border-stone-900/35 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <RefreshCw size={15} aria-hidden />
            {t("rep.rescan")}
          </button>
          <button
            type="button"
            onClick={props.onHome}
            className="inline-flex items-center gap-2 rounded-2xl border border-stone-900/15 bg-white px-6 py-3 text-sm font-medium text-stone-600 shadow-sm transition-colors hover:border-stone-900/35 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <House size={15} aria-hidden />
            {t("nav.home")}
          </button>
        </div>
      </div>
    </div>
  );
}
