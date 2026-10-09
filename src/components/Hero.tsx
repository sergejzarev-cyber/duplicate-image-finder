import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarPlus,
  Check,
  ExternalLink,
  FolderOpen,
  CodeXml,
  Globe,
  History,
  Lock,
  Maximize2,
  Play,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Type,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "../i18n";
import { KEEP_RULES } from "../core/selection";
import type { KeepRule } from "../types";
import type { Scanner } from "../hooks/useScanner";
import { GITHUB_URL } from "../lib/site";
import { SeoHow, SeoSections } from "./SeoSections";

const RULE_ICONS: Record<KeepRule, LucideIcon> = {
  resolution: Maximize2,
  oldest: History,
  newest: CalendarPlus,
  shortest: Type,
};

/** Демо-пара: 0 — оригинал (больше, старше), 1 — пережатая копия (меньше, новее, короче имя).
 *  Правило сразу видно в действии: выбор в демо переключается вместе с ним. */
const RULE_DEMO_KEPT: Record<KeepRule, 0 | 1> = {
  resolution: 0,
  oldest: 0,
  newest: 1,
  shortest: 1,
};

/** Обычный компактный переключатель: выглядит как настройка, а не как кнопка-действие */
function InlineSwitch(props: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
  tip?: string;
  badge?: string;
}) {
  return (
    <label
      className="flex cursor-pointer items-center gap-2.5"
      title={props.tip ?? props.hint}
    >
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={props.checked}
          onChange={(e) => props.onChange(e.target.checked)}
        />
        <span
          aria-hidden
          className="block h-5 w-9 rounded-full bg-stone-300 transition-colors peer-checked:bg-emerald-700 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-700 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#faf8f3]"
        />
        <span
          aria-hidden
          className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4"
        />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-medium text-stone-800">
          {props.label}
          {props.badge && (
            <span className="rounded-full bg-emerald-700/[0.08] px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              {props.badge}
            </span>
          )}
        </span>
        <span className="block text-xs text-stone-600">{props.hint}</span>
      </span>
    </label>
  );
}

function Card(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-stone-900/10 bg-white shadow-[0_24px_70px_-30px_rgba(28,25,23,0.3)] ${props.className ?? ""}`}
    >
      {props.children}
    </div>
  );
}

/** Живое демо: два похожих снимка, бейдж 98%, выбор «оставить» — как в результатах.
 *  Управляется снаружи: переключение правила «Какой файл оставить» меняет выбор здесь. */
function LiveDemo(props: { kept: number; onKeep: (i: number) => void }) {
  const { t } = useI18n();
  const kept = props.kept;
  // одно и то же фото: оригинал + пережатая копия — эффект «98%» очевиден сразу.
  // Лёгкий фильтр на второй намекает на потерю качества при сжатии.
  const photos = [
    { src: "/images/demo-similar-1.jpg", meta: t("demo.metaBig"), filter: "" },
    { src: "/images/demo-similar-1.jpg", meta: t("demo.metaSmall"), filter: "saturate-[0.92] contrast-[0.97]" },
  ];

  return (
    <div className="floaty rounded-2xl border border-stone-900/10 bg-white/95 p-4 shadow-[0_28px_60px_-20px_rgba(15,42,68,0.45)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
          <Sparkles size={14} className="text-amber-600" aria-hidden />
          {t("demo.title")}
        </p>
        <span className="rounded-full bg-stone-950 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
          {t("demo.badge")}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5" role="group" aria-label={t("demo.title")}>
        {photos.map((p, i) => {
          const isKept = kept === i;
          return (
            <div key={`${p.src}-${i}`}>
              <button
                type="button"
                onClick={() => props.onKeep(i)}
                aria-pressed={isKept}
                className={`group relative block w-full overflow-hidden rounded-xl border bg-stone-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                  isKept
                    ? "border-emerald-600 ring-1 ring-emerald-600"
                    : "border-stone-900/10 hover:border-stone-900/30"
                }`}
              >
                <span className="relative block aspect-[4/3]">
                  <img src={p.src} alt="" loading="lazy" decoding="async" className={`h-full w-full object-cover ${p.filter}`} />
                  {!isKept && <span aria-hidden className="absolute inset-0 bg-red-900/10" />}
                  <span
                    aria-hidden
                    className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide shadow ${
                      isKept ? "bg-emerald-600 text-white" : "bg-red-600/95 text-white"
                    }`}
                  >
                    {isKept ? <Check size={11} strokeWidth={3} /> : <Trash2 size={11} />}
                    {isKept ? t("res.keep") : t("res.remove")}
                  </span>
                </span>
              </button>
              <p className="mt-1.5 text-center text-[11px] font-medium text-stone-600">{p.meta}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full bg-amber-500 px-2.5 py-1 font-mono text-[11px] font-bold text-white shadow">
          {t("demo.match")}
        </span>
        <span className="text-[10px] text-stone-500" title="Δ 1 · dHash 64-bit">{t("demo.tech")}</span>
      </div>
      <p className="mt-2.5 border-t border-stone-900/10 pt-2.5 text-[11px] leading-relaxed text-stone-600">
        {t("demo.note")}
      </p>
    </div>
  );
}

export function Hero({ s }: { s: Scanner }) {
  const { t } = useI18n();
  /** полный режим доступен только без причин блокировки */
  const iframeBlocked = s.blockReason === "cross-origin-frame" || s.pickerBlocked;
  const insecure = s.blockReason === "insecure-context";
  const noApi = s.blockReason === "api-missing";
  const fullMode = s.blockReason === "none" && !s.pickerBlocked;
  const [isMobileDevice] = useState(
    () => typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  );
  const [demoKept, setDemoKept] = useState(0);
  const openInNewTab = () => window.open(window.location.href, "_blank", "noopener");
  const openHttps = () =>
    window.open(window.location.href.replace(/^http:/, "https:"), "_blank", "noopener");

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      {/* ===== Деловой hero-блок: спокойный градиент + едва видимая фотомозаика ===== */}
      <section className="hero-in relative overflow-hidden rounded-[2rem] border border-stone-900/10 bg-gradient-to-br from-white via-[#faf8f3] to-emerald-50/50 shadow-[0_32px_80px_-32px_rgba(15,42,68,0.45)]">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-700/[0.06] blur-[80px]" />

        <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[1.05fr_0.95fr] lg:p-14">
          {/* левая часть: оффер */}
          <div>
            <h1
              className="rise mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-[#0f2a44] sm:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              {t("hero.title1")}
              <br />
              <span className="text-emerald-800">
                {t("hero.title2")}
              </span>
            </h1>
            <p
              className="rise mt-5 max-w-xl text-base leading-relaxed text-stone-700 sm:text-lg"
              style={{ animationDelay: "140ms" }}
            >
              {t("hero.sub")}
            </p>

            <div className="rise mt-8 flex flex-wrap items-center gap-4" style={{ animationDelay: "200ms" }}>
              <a
                href="/app"
                className="btn-shine group inline-flex items-center gap-3 rounded-2xl bg-[#0f2a44] px-7 py-4 text-base font-semibold text-white shadow-[0_18px_44px_-14px_rgba(15,42,68,0.6)] transition-all hover:-translate-y-0.5 hover:bg-[#14355a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f3] active:translate-y-0"
              >
                <FolderOpen size={20} aria-hidden className="transition-transform group-hover:scale-110" />
                {t("hero.cta")}
              </a>
              <span className="flex flex-col items-start gap-1">
                <a
                  href="/app?demo=1"
                  className="group inline-flex items-center gap-2 rounded-2xl border border-stone-900/15 bg-white/80 px-5 py-3.5 text-sm font-semibold text-stone-700 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-emerald-700/40 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 active:translate-y-0"
                >
                  <Play size={16} aria-hidden className="transition-transform group-hover:scale-110" />
                  {t("hero.demo")}
                </a>
                <span className="pl-1 text-[11px] font-medium text-stone-700">{t("hero.demoHint")}</span>
              </span>
            </div>

            {/* опции — обычные переключатели в одну строку под кнопками */}
            <div
              className="rise mt-5 flex flex-wrap items-center gap-x-7 gap-y-3"
              style={{ animationDelay: "220ms" }}
            >
              <InlineSwitch
                checked={s.recursive}
                onChange={s.setRecursive}
                label={t("opt.rec")}
                hint={s.recursive ? t("opt.recOn") : t("opt.recOff")}
              />
              <InlineSwitch
                checked={s.findSimilar}
                onChange={s.setFindSimilar}
                label={t("opt.sim")}
                hint={t("opt.simHint")}
                tip={t("opt.simTip")}
                badge={t("opt.simBadge")}
              />
            </div>

            {/* совместимость: Chrome видит маленькую серую строку, остальные — карточку ниже */}
            {fullMode && (
              <p
                className="rise mt-4 flex max-w-xl items-center gap-1.5 text-xs font-medium text-stone-600"
                style={{ animationDelay: "240ms" }}
              >
                <Globe size={13} className="shrink-0 text-stone-500" aria-hidden />
                {t("hero.compatMini")}
              </p>
            )}

            {s.cancelled && (
              <p className="mt-4 font-mono text-xs text-stone-600">— {t("hero.cancelNote")}</p>
            )}
            {s.fatal && (
              <p className="mt-4 flex items-center gap-2 text-sm font-medium text-red-700">
                <AlertTriangle size={15} aria-hidden /> {t("hero.fatal")}
              </p>
            )}

          </div>

          {/* правая часть: живое демо похожих фото */}
          <div className="relative flex items-center lg:min-h-[380px]">
            <div className="w-full max-w-sm lg:ml-auto">
              <LiveDemo kept={demoKept} onKeep={setDemoKept} />
            </div>
          </div>
        </div>

      </section>

      {/* ===== Предупреждения окружения ===== */}
      {noApi && (
        <Card className="rise mt-6 border-amber-600/25 bg-amber-50 p-5">
          <div className="flex gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900">
                {isMobileDevice ? t("hero.mobile.t") : t("hero.unsup.t")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-900/80">
                {isMobileDevice ? t("hero.mobile.d") : t("hero.unsup.d")}
              </p>
              <a
                href="/app?demo=1"
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-700/40 bg-white px-3.5 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
              >
                <Play size={13} aria-hidden />
                {t("hero.demo")}
              </a>
            </div>
          </div>
        </Card>
      )}

      {insecure && (
        <Card className="rise mt-6 border-amber-600/25 bg-amber-50 p-5">
          <div className="flex gap-3">
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
        </Card>
      )}

      {iframeBlocked && (
        <Card className="rise mt-6 border-sky-700/25 bg-sky-50 p-5">
          <div className="flex gap-3">
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
        </Card>
      )}

      {/* Как это работает — сначала общая картина, детали («Какой файл оставить») ниже */}
      <div className="mt-8">
        <SeoHow />
      </div>

      {/* ===== Параметры + возможности ===== */}
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* параметры */}
        <Card className="rise p-6 lg:sticky lg:top-24">
          <div style={{ animationDelay: "150ms" }}>
            <p className="flex items-center gap-2 border-b border-[#0f2a44]/10 pb-3 text-sm font-bold uppercase tracking-wider text-[#0f2a44]">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0f2a44] text-white">
                <SlidersHorizontal size={15} aria-hidden />
              </span>
              {t("opt.rule")}
            </p>
            <div
              role="radiogroup"
              aria-label={t("opt.rule")}
              className="mt-4 grid grid-cols-2 gap-2"
            >
                {KEEP_RULES.map((r) => {
                  const Icon = RULE_ICONS[r];
                  return (
                    <label
                      key={r}
                      className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-stone-900/10 bg-stone-950/[0.02] px-3 py-2.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-900/25 has-checked:border-emerald-700/50 has-checked:bg-emerald-700/[0.07] has-checked:text-emerald-900 has-focus-visible:ring-2 has-focus-visible:ring-emerald-700"
                    >
                      <input
                        type="radio"
                        name="keep-rule"
                        className="sr-only"
                        checked={s.rule === r}
                        onChange={() => {
                          s.applyRule(r);
                          setDemoKept(RULE_DEMO_KEPT[r]);
                        }}
                      />
                      <Icon size={15} aria-hidden className="shrink-0 text-stone-500" />
                      {t(`rule.${r}`)}
                    </label>
                  );
                })}
            </div>

            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-stone-500">
              <Sparkles size={12} className="shrink-0 text-amber-600" aria-hidden />
              {t("opt.demoLink")}
            </p>

            <p className="mt-5 border-t border-stone-900/10 pt-4 text-xs leading-relaxed text-stone-600">
              {t("opt.note")}
            </p>
          </div>
        </Card>

        {/* возможности + приватность */}
        <div>
          <Card className="rise overflow-hidden p-0">
            <div className="h-1.5 bg-gradient-to-r from-[#0f2a44] via-emerald-700 to-amber-500" aria-hidden />
            <div className="p-5" style={{ animationDelay: "420ms" }}>
              <div className="flex gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-700/[0.08] text-emerald-800">
                  <ShieldCheck size={20} aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-stone-900">{t("priv.t")}</p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-700">{t("priv.d")}</p>
                  <ul className="mt-2 space-y-1">
                    {t("priv.net")
                      .split("\n")
                      .map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-1.5 text-[13px] leading-relaxed text-stone-700"
                        >
                          <span
                            aria-hidden
                            className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600/60"
                          />
                          {item}
                        </li>
                      ))}
                  </ul>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-xs font-semibold text-emerald-800 underline-offset-4 transition-colors hover:text-emerald-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                  >
                    <CodeXml size={14} aria-hidden />
                    {t("priv.code")}
                  </a>
                </div>
              </div>
              <details className="mt-4 border-t border-stone-900/10 pt-3">
                <summary className="cursor-pointer text-xs font-semibold text-stone-600 transition-colors hover:text-stone-900">
                  {t("priv.check")}
                </summary>
                <ol className="mt-2.5 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-stone-600">
                  <li>{t("priv.step1")}</li>
                  <li>{t("priv.step2")}</li>
                  <li>{t("priv.step3")}</li>
                  <li>{t("priv.step4")}</li>
                </ol>
              </details>
            </div>
          </Card>
        </div>
      </div>

      <SeoSections />

      {/* Финальный призыв: после FAQ посетитель не должен упираться в футер */}
      <section aria-labelledby="cta-final" className="rise mx-auto mt-16 max-w-2xl rounded-[2rem] border border-stone-900/10 bg-[#0f2a44] p-8 text-center shadow-[0_32px_80px_-32px_rgba(15,42,68,0.45)] sm:p-12">
        <h2 id="cta-final" className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {t("cta.t")}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/80">
          {t("cta.d")}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/app"
            className="inline-flex items-center gap-2.5 rounded-2xl bg-white px-7 py-3.5 text-base font-semibold text-[#0f2a44] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:translate-y-0"
          >
            <FolderOpen size={18} aria-hidden />
            {t("hero.cta")}
          </a>
          <a
            href="/app?demo=1"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:translate-y-0"
          >
            <Play size={16} aria-hidden />
            {t("hero.demo")}
          </a>
        </div>
      </section>
    </div>
  );
}
