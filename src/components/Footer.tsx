import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CodeXml, FileText, Mail, Scale, X } from "lucide-react";
import { useI18n } from "../i18n";
import { GITHUB_URL } from "../lib/site";
import { getDonateUrl } from "../lib/donate";
import { IMPRINT, PRIVACY } from "../legal/legal";
import type { Lang } from "../types";

type LegalKind = "imprint" | "privacy" | null;

const HASH_BY_KIND: Record<Exclude<LegalKind, null>, string> = {
  imprint: "#impressum",
  privacy: "#datenschutz",
};

const UPDATED_NOTE: Record<Lang, string> = {
  de: "Stand: Oktober 2026",
  en: "Last updated: October 2026",
  ru: "Обновлено: октябрь 2026",
};

function kindFromHash(): LegalKind {
  const h = window.location.hash.toLowerCase();
  if (h === "#impressum" || h === "#imprint") return "imprint";
  if (h === "#datenschutz" || h === "#privacy") return "privacy";
  return null;
}

/** Кликабельные e-mail и URL внутри строки */
function linkify(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\s+)/);
  return parts.map((tok, i) => {
    const m = tok.match(/^([\w.+-]+@[\w-]+\.[\w.]+)([.,;:!?)]*)$/);
    if (m) {
      return (
        <span key={`${keyPrefix}-${i}`}>
          <a
            href={`mailto:${m[1]}`}
            className="font-medium text-emerald-800 underline underline-offset-2 hover:text-emerald-950"
            onClick={(e) => e.stopPropagation()}
          >
            {m[1]}
          </a>
          {m[2]}
        </span>
      );
    }
    const u = tok.match(/^((?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s)]*)?)([.,;:!?)]*)$/i);
    if (u && u[1] && u[1].includes(".")) {
      const href = u[1].startsWith("http") ? u[1] : `https://${u[1]}`;
      // не превращаем в ссылки обычные слова с точкой в конце предложения
      if (/^https?:\/\//i.test(tok) || tok.includes("/") || tok.includes("vercel") || tok.includes("paypal") || tok.includes("formspree") || tok.includes("google")) {
        return (
          <span key={`${keyPrefix}-${i}`}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-800 underline underline-offset-2 hover:text-emerald-950"
              onClick={(e) => e.stopPropagation()}
            >
              {u[1]}
            </a>
            {u[2]}
          </span>
        );
      }
    }
    return <span key={`${keyPrefix}-${i}`}>{tok}</span>;
  });
}

function isHeadingLine(line: string): boolean {
  const s = line.trim();
  if (!s) return false;
  if (/^\d+\.\s+\S/.test(s) && s.length < 140) return true; // "1. Datenschutz..."
  if (s.length <= 80 && !/[.!?…]$/.test(s) && /^[A-ZÄÖÜA-ZА-ЯЁ]/.test(s)) return true; // "Allgemeine Hinweise", "Kontakt:"
  return false;
}

/**
 * Структурированный рендер юртекста: заголовки — жирным,
 * адресные строки — через <br/>, e-mail и URL — ссылками.
 */
function renderLegal(text: string): ReactNode {
  const blocks = text.split(/\n{2,}/);
  return blocks.map((block, bi) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;
    // первая строка — заголовок, если нумерованная / с двоеточием / короткая перед длинным абзацем
    const first = lines[0];
    const second = lines[1] ?? "";
    const firstIsHeading =
      /^\d+\.\s+\S/.test(first) ||
      /:$/.test(first) ||
      (first.length <= 80 && second.length > 90 && isHeadingLine(first));
    const startIdx = firstIsHeading ? 1 : 0;
    return (
      <div key={bi} className={bi > 0 ? "mt-4" : ""}>
        {firstIsHeading && (
          <h3 className="text-sm font-bold text-stone-950">{linkify(first, `h${bi}`)}</h3>
        )}
        {lines.slice(startIdx).map((line, li) =>
          isHeadingLine(line) && lines.length === 1 ? (
            <h3 key={li} className="text-sm font-bold text-stone-950">
              {linkify(line, `b${bi}l${li}`)}
            </h3>
          ) : (
            <p key={li} className="mt-1.5 text-sm leading-relaxed text-stone-700 first:mt-0">
              {linkify(line, `b${bi}l${li}`)}
            </p>
          )
        )}
      </div>
    );
  });
}

export function Footer(props: {
  onFeedback: () => void;
  onDonate: () => void;
  /** external (/app): фидбек и донат — внешние ссылки в новой вкладке, без диалогов. */
  external?: boolean;
  /** hideFeedbackLink (/feedback): не показывать ссылку на самого себя. */
  hideFeedbackLink?: boolean;
}) {
  const { t, lang } = useI18n();
  const [legal, setLegal] = useState<LegalKind>(null);

  // якоря: #impressum / #datenschutz открывают диалог, кнопка «назад» закрывает
  useEffect(() => {
    setLegal(kindFromHash());
    const onHash = () => setLegal(kindFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // открывали ли диалог через push (тогда закрытие = history.back),
  // или это прямая ссылка #impressum (тогда чистим URL через replaceState)
  const pushedRef = useRef(false);

  const open = useCallback((kind: Exclude<LegalKind, null>) => {
    pushedRef.current = true;
    window.location.hash = HASH_BY_KIND[kind];
    setLegal(kind);
  }, []);

  const close = useCallback(() => {
    setLegal(null);
    if (pushedRef.current && kindFromHash()) {
      pushedRef.current = false;
      window.history.back(); // вернёт #results / пустой хэш, hashchange синхронизирует
    } else if (kindFromHash()) {
      pushedRef.current = false;
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const linkCls =
    "rounded px-1 py-0.5 text-xs font-semibold text-stone-600 underline-offset-4 transition-colors hover:text-stone-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700";

  const body = legal === "imprint" ? IMPRINT[lang] : legal === "privacy" ? PRIVACY[lang] : "";

  return (
    <>
      <footer className="border-t border-stone-900/10 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 sm:px-6">
          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1"
          >
            <a href="#impressum" onClick={(e) => { e.preventDefault(); open("imprint"); }} className={linkCls}>
              {t("leg.imprint")}
            </a>
            <span aria-hidden className="text-stone-400">
              ·
            </span>
            <a href="#datenschutz" onClick={(e) => { e.preventDefault(); open("privacy"); }} className={linkCls}>
              {t("leg.privacy")}
            </a>
            <span aria-hidden className="text-stone-400">
              ·
            </span>
            <a
              href="/verify"
              {...(props.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={linkCls}
            >
              {t("foot.verify")}
            </a>
            {!props.hideFeedbackLink && (
              <>
                <span aria-hidden className="text-stone-400">
                  ·
                </span>
                {props.external ? (
                  <a
                    href="/feedback"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkCls}
                  >
                    {t("fb.footer")}
                  </a>
                ) : (
                  <button type="button" onClick={props.onFeedback} className={linkCls}>
                    {t("fb.footer")}
                  </button>
                )}
              </>
            )}
            <span aria-hidden className="text-stone-400">
              ·
            </span>
            {props.external ? (
              <a
                href={getDonateUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded px-1 py-0.5 text-xs font-semibold text-amber-800 underline-offset-4 transition-colors hover:text-amber-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
              >
                {t("donate.footer")}
              </a>
            ) : (
              <button
                type="button"
                onClick={props.onDonate}
                className="rounded px-1 py-0.5 text-xs font-semibold text-amber-800 underline-offset-4 transition-colors hover:text-amber-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
              >
                {t("donate.footer")}
              </button>
            )}
            <span aria-hidden className="text-stone-400">
              ·
            </span>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-semibold text-stone-600 underline-offset-4 transition-colors hover:text-stone-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <CodeXml size={13} aria-hidden />
              GitHub
            </a>
          </nav>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-700">
            {t("foot.tag")}
            {(() => {
              try {
                return typeof __COMMIT__ === "string" && __COMMIT__ !== "dev"
                  ? ` · ${__COMMIT__.slice(0, 7)}`
                  : "";
              } catch {
                return "";
              }
            })()}
          </p>
        </div>
      </footer>

      {legal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t(legal === "imprint" ? "leg.imprintT" : "leg.privacyT")}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
        >
          <div aria-hidden className="absolute inset-0 bg-stone-950/55 backdrop-blur-sm" />
          <div
            className={`rise relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl border border-stone-900/10 bg-white shadow-2xl ${
              legal === "privacy" ? "max-w-2xl" : "max-w-lg"
            }`}
          >
            <div className="flex items-start justify-between gap-3 border-b border-stone-900/10 bg-white/95 p-6 pb-4 backdrop-blur sm:px-8">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#0f2a44]/[0.07] text-[#0f2a44]">
                {legal === "imprint" ? <Scale size={20} aria-hidden /> : <FileText size={20} aria-hidden />}
              </span>
              <button
                type="button"
                onClick={close}
                autoFocus
                aria-label={t("leg.close")}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-stone-500 transition-colors hover:bg-stone-900/5 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                <X size={17} aria-hidden />
              </button>
            </div>
            <div className="overflow-auto p-6 pt-4 sm:px-8 sm:pb-8">
              <h2 className="font-display text-xl font-bold tracking-tight text-stone-950">
                {t(legal === "imprint" ? "leg.imprintT" : "leg.privacyT")}
              </h2>
              <div className="mt-2">{renderLegal(body)}</div>
              <p className="mt-6 border-t border-stone-900/10 pt-3 font-mono text-[11px] text-stone-400">
                {UPDATED_NOTE[lang]}
              </p>
              {legal === "imprint" && (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    props.onFeedback();
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <Mail size={13} aria-hidden />
                  {t("leg.contact")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
