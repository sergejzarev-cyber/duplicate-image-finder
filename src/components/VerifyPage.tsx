import { ArrowLeft, CodeXml, FileText, FolderOpen, Globe, WifiOff } from "lucide-react";
import { useI18n } from "../i18n";
import { GITHUB_URL } from "../lib/site";

const CSP_SNIPPET = "Content-Security-Policy: … connect-src 'none' …";

function commitShort(): string | null {
  try {
    const h = typeof __COMMIT__ === "string" ? __COMMIT__ : "";
    if (!h || h === "dev") return null;
    return h.slice(0, 7);
  } catch {
    return null;
  }
}

/** /verify — «Проверьте сами»: Network, офлайн, заголовки, исходники. */
export function VerifyPage() {
  const { t } = useI18n();
  const commit = commitShort();

  const steps = [
    { icon: Globe, title: t("verify.aT"), desc: t("verify.aD") },
    { icon: WifiOff, title: t("verify.bT"), desc: t("verify.bD") },
    { icon: FileText, title: t("verify.cT"), desc: t("verify.cD") },
    { icon: CodeXml, title: t("verify.dT"), desc: t("verify.dD") },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
        {t("verify.t")}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-600">{t("verify.sub")}</p>

      <div className="mt-8 space-y-4">
        {steps.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-stone-900/10 bg-white p-5 shadow-[0_12px_32px_-16px_rgba(28,25,23,0.25)]"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0f2a44]/[0.07] text-[#0f2a44]">
                <s.icon size={18} aria-hidden />
              </span>
              <h2 className="text-base font-bold text-stone-950">{s.title}</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-stone-900/10 bg-stone-950/[0.02] p-5">
        <p className="font-mono text-[11px] leading-relaxed text-stone-600">{CSP_SNIPPET}</p>
        {commit && (
          <p className="mt-2 font-mono text-[11px] text-stone-500">
            {t("verify.commit", { hash: commit })}
          </p>
        )}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-xs font-semibold text-emerald-800 underline-offset-4 hover:text-emerald-950 hover:underline"
        >
          <CodeXml size={14} aria-hidden />
          GitHub
        </a>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-600/25 bg-amber-50 px-5 py-4">
        <p className="text-sm font-bold text-amber-900">{t("verify.limitsT")}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-amber-900/80">{t("verify.limitsD")}</p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-stone-900/15 bg-white px-6 py-3 text-sm font-medium text-stone-600 shadow-sm transition-colors hover:border-stone-900/35 hover:text-stone-950"
        >
          <ArrowLeft size={15} aria-hidden />
          {t("verify.back")}
        </a>
        <a
          href="/app"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#0f2a44] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#14355a]"
        >
          <FolderOpen size={15} aria-hidden />
          {t("verify.openApp")}
        </a>
      </div>
    </div>
  );
}
