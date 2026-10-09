import { useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  FolderOpen,
  Globe,
  Lock,
  Play,
} from "lucide-react";
import { useI18n } from "../i18n";
import type { Scanner } from "../hooks/useScanner";

/** Компактный стартовый экран /app: toggles + запуск + предупреждения окружения. */
export function ScannerStart({ s }: { s: Scanner }) {
  const { t } = useI18n();
  const iframeBlocked = s.blockReason === "cross-origin-frame" || s.pickerBlocked;
  const insecure = s.blockReason === "insecure-context";
  const noApi = s.blockReason === "api-missing";
  const fullMode = s.blockReason === "none" && !s.pickerBlocked;
  const [isMobileDevice] = useState(
    () => typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  );
  const onPick = fullMode ? s.pickAndScan : s.pickAndScanFallback;
  const openInNewTab = () => window.open(window.location.href, "_blank", "noopener");
  const openHttps = () =>
    window.open(window.location.href.replace(/^http:/, "https:"), "_blank", "noopener");

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-800">
        {t("hero.kicker")}
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight text-[#0f2a44] sm:text-5xl">
        {t("hero.title1")} <span className="text-emerald-800">{t("hero.title2")}</span>
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-700">{t("hero.sub")}</p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onPick}
          className="inline-flex items-center gap-3 rounded-2xl bg-[#0f2a44] px-7 py-4 text-base font-semibold text-white shadow-[0_18px_44px_-14px_rgba(15,42,68,0.6)] transition-all hover:-translate-y-0.5 hover:bg-[#14355a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 active:translate-y-0"
        >
          <FolderOpen size={20} aria-hidden />
          {t("hero.cta")}
        </button>
        <span className="flex flex-col items-start gap-1">
          <button
            type="button"
            onClick={s.runDemo}
            className="inline-flex items-center gap-2 rounded-2xl border border-stone-900/15 bg-white px-5 py-3.5 text-sm font-semibold text-stone-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-700/40 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 active:translate-y-0"
          >
            <Play size={16} aria-hidden />
            {t("hero.demo")}
          </button>
          <span className="pl-1 text-[11px] font-medium text-stone-700">{t("hero.demoHint")}</span>
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
        <label className="flex cursor-pointer items-center gap-2.5" title={t("opt.recOn")}>
          <span className="relative inline-flex shrink-0">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={s.recursive}
              onChange={(e) => s.setRecursive(e.target.checked)}
            />
            <span
              aria-hidden
              className="block h-5 w-9 rounded-full bg-stone-300 transition-colors peer-checked:bg-emerald-700 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-700 peer-focus-visible:ring-offset-2"
            />
            <span
              aria-hidden
              className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4"
            />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-stone-800">{t("opt.rec")}</span>
            <span className="block text-xs text-stone-600">
              {s.recursive ? t("opt.recOn") : t("opt.recOff")}
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-2.5" title={t("opt.simTip")}>
          <span className="relative inline-flex shrink-0">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={s.findSimilar}
              onChange={(e) => s.setFindSimilar(e.target.checked)}
            />
            <span
              aria-hidden
              className="block h-5 w-9 rounded-full bg-stone-300 transition-colors peer-checked:bg-emerald-700 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-700 peer-focus-visible:ring-offset-2"
            />
            <span
              aria-hidden
              className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4"
            />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-medium text-stone-800">
              {t("opt.sim")}
              <span className="rounded-full bg-emerald-700/[0.08] px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                {t("opt.simBadge")}
              </span>
            </span>
            <span className="block text-xs text-stone-600">{t("opt.simHint")}</span>
          </span>
        </label>
      </div>

      {fullMode && (
        <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-stone-600">
          <Globe size={13} className="shrink-0 text-stone-500" aria-hidden />
          {t("hero.compatMini")}
        </p>
      )}

      {s.cancelled && <p className="mt-4 font-mono text-xs text-stone-600">— {t("hero.cancelNote")}</p>}
      {s.fatal && (
        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-red-700">
          <AlertTriangle size={15} aria-hidden /> {t("hero.fatal")}
        </p>
      )}

      {noApi && (
        <div className="mt-6 flex gap-3 rounded-2xl border border-amber-600/25 bg-amber-50 p-5">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {isMobileDevice ? t("hero.mobile.t") : t("hero.unsup.t")}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-900/80">
              {isMobileDevice ? t("hero.mobile.d") : t("hero.unsup.d")}
            </p>
            <button
              type="button"
              onClick={s.runDemo}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-700/40 bg-white px-3.5 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
            >
              <Play size={13} aria-hidden />
              {t("hero.demo")}
            </button>
          </div>
        </div>
      )}

      {insecure && (
        <div className="mt-6 flex gap-3 rounded-2xl border border-amber-600/25 bg-amber-50 p-5">
          <Lock size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900">{t("hero.insec.t")}</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-900/80">{t("hero.insec.d")}</p>
            <button
              type="button"
              onClick={openHttps}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-700/40 bg-white px-3.5 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
            >
              <Lock size={13} aria-hidden />
              {t("hero.insec.open")}
            </button>
          </div>
        </div>
      )}

      {iframeBlocked && (
        <div className="mt-6 flex gap-3 rounded-2xl border border-sky-700/25 bg-sky-50 p-5">
          <ExternalLink size={18} className="mt-0.5 shrink-0 text-sky-800" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-sky-950">{t("hero.embed.t")}</p>
            <p className="mt-1 text-sm leading-relaxed text-sky-950/80">{t("hero.embed.d")}</p>
            <button
              type="button"
              onClick={openInNewTab}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-sky-700/40 bg-white px-3.5 py-2 text-xs font-semibold text-sky-900 transition-colors hover:bg-sky-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
            >
              <ExternalLink size={13} aria-hidden />
              {t("hero.embed.open")}
            </button>
          </div>
        </div>
      )}

      <p className="mt-8 text-xs text-stone-500">
        <a href="/" className="font-semibold underline underline-offset-4 hover:text-stone-900">
          {t("nav.home")}
        </a>
        <span aria-hidden className="mx-2 text-stone-300">
          ·
        </span>
        <a
          href="/verify"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-4 hover:text-stone-900"
        >
          {t("foot.verify")}
        </a>
      </p>
    </div>
  );
}
