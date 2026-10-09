import { House, Layers, MessageSquarePlus, ShieldCheck } from "lucide-react";
import { LANG_LABELS, LANG_ORDER, useI18n } from "../i18n";

export function Header(props: {
  onHome: () => void;
  canGoHome: boolean;
  onFeedback: () => void;
  /** Внешние ссылки (страницы /app, /feedback, /verify): вместо кнопок — <a>. */
  homeHref?: string;
  feedbackHref?: string;
  feedbackNewTab?: boolean;
  hideFeedback?: boolean;
}) {
  const { lang, setLang, t } = useI18n();
  return (
    <header className="sticky top-[3px] z-40 border-b border-[#0f2a44]/10 bg-[#faf8f3]/88 shadow-[0_1px_0_rgba(15,42,68,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {props.homeHref ? (
            <a
              href={props.homeHref}
              aria-label={t("nav.homeAria")}
              title={t("nav.home")}
              className="group flex min-w-0 items-center gap-3 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-stone-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <span
                aria-hidden
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#0f2a44] to-[#1a4a7a] text-white shadow-[0_8px_20px_-8px_rgba(15,42,68,0.6)] transition-transform group-hover:scale-105"
              >
                <Layers size={18} strokeWidth={2.5} />
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-[#0f2a44]">
                DupSweep
              </span>
              <span className="hidden font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-600 lg:inline">
                {t("nav.tag")}
              </span>
            </a>
          ) : (
            <button
              type="button"
              onClick={props.onHome}
              disabled={!props.canGoHome}
              aria-label={t("nav.homeAria")}
              title={t("nav.home")}
              className="group flex min-w-0 items-center gap-3 rounded-xl py-1 pl-1 pr-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:cursor-default enabled:hover:bg-stone-900/5"
            >
              <span
                aria-hidden
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#0f2a44] to-[#1a4a7a] text-white shadow-[0_8px_20px_-8px_rgba(15,42,68,0.6)] transition-transform enabled:group-hover:scale-105"
              >
                <Layers size={18} strokeWidth={2.5} />
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-[#0f2a44]">
                DupSweep
              </span>
              <span className="hidden font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-600 lg:inline">
                {t("nav.tag")}
              </span>
            </button>
          )}
          {props.homeHref ? (
            <a
              href={props.homeHref}
              className="hidden items-center gap-1.5 rounded-full border border-stone-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition-colors hover:border-stone-900/25 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:inline-flex"
            >
              <House size={13} aria-hidden />
              {t("nav.home")}
            </a>
          ) : (
            props.canGoHome && (
              <button
                type="button"
                onClick={props.onHome}
                className="hidden items-center gap-1.5 rounded-full border border-stone-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition-colors hover:border-stone-900/25 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:inline-flex"
              >
                <House size={13} aria-hidden />
                {t("nav.home")}
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-700/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-800 md:flex">
            <ShieldCheck size={14} aria-hidden />
            {t("privacy.badge")}
          </span>
          {!props.hideFeedback &&
            (props.feedbackHref ? (
              <a
                href={props.feedbackHref}
                {...(props.feedbackNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                aria-label={t("fb.button")}
                title={t("fb.button")}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition-colors hover:border-stone-900/25 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                <MessageSquarePlus size={14} aria-hidden />
                <span className="hidden sm:inline">{t("fb.button")}</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={props.onFeedback}
                aria-label={t("fb.button")}
                title={t("fb.button")}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition-colors hover:border-stone-900/25 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                <MessageSquarePlus size={14} aria-hidden />
                <span className="hidden sm:inline">{t("fb.button")}</span>
              </button>
            ))}
          <div
            role="group"
            aria-label={t("a11y.lang")}
            className="flex rounded-full border border-stone-900/10 bg-white p-1 shadow-sm"
          >
            {LANG_ORDER.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                  lang === l ? "bg-stone-950 text-white" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
