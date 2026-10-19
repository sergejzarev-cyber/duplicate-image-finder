import { AlertTriangle, Check, FolderOpen, HardDrive, ScanSearch, X } from "lucide-react";
import { useI18n } from "../i18n";

/**
 * SEO- и доверительные блоки под главным экраном:
 * «Как это работает», сравнение с альтернативами, FAQ.
 * Именно эти тексты находятся в поиске («doppelte Fotos finden» и т.п.).
 */
/** «Как это работает» отдельно: в Hero идёт до деталей («Какой файл оставить») */
export function SeoHow() {
  const { t } = useI18n();

  const steps = [
    { n: 1, icon: FolderOpen, title: t("seo.s1t"), desc: t("seo.s1d") },
    { n: 2, icon: ScanSearch, title: t("seo.s2t"), desc: t("seo.s2d") },
    { n: 3, icon: HardDrive, title: t("seo.s3t"), desc: t("seo.s3d") },
  ];

  return (
    <section aria-labelledby="seo-how">
      <h2
        id="seo-how"
        className="text-center font-display text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl"
      >
        {t("seo.howT")}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm leading-relaxed text-stone-600">
        {t("seo.howD")}
      </p>
      <div className="relative mt-8 grid items-stretch gap-4 md:grid-cols-3">
        <div
          aria-hidden
          className="absolute left-[16%] right-[16%] top-11 hidden border-t-2 border-dashed border-stone-900/15 md:block"
        />
        {steps.map((s) => (
          <div
            key={s.title}
            className="relative flex h-full flex-col rounded-2xl border border-stone-900/10 bg-white p-6 shadow-[0_12px_32px_-16px_rgba(28,25,23,0.25)]"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0f2a44] font-display text-sm font-bold tabular-nums text-white"
              >
                {s.n}
              </span>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0f2a44]/[0.07] text-[#0f2a44]">
                <s.icon size={20} aria-hidden />
              </span>
            </div>
            <h3 className="mt-4 text-base font-bold text-stone-950">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SeoSections() {
  const { t } = useI18n();

  type Cell = boolean | "partial";
  const rows: { label: string; us: Cell; desk: Cell; cloud: Cell }[] = [
    { label: t("seo.r1"), us: true, desk: false, cloud: true },
    { label: t("seo.r2"), us: true, desk: true, cloud: false },
    // iCloud и Google Photos подсказывают дубликаты — честно «teilweise», а не крест
    { label: t("seo.r3"), us: true, desk: true, cloud: "partial" },
    // dupeGuru и czkawka открыты — честно ставим «teilweise», а не крест
    { label: t("seo.r4"), us: true, desk: "partial", cloud: false },
    { label: t("seo.r5"), us: true, desk: true, cloud: false },
    { label: t("seo.r6"), us: false, desk: true, cloud: true },
  ];

  const faqs = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    q: t(`seo.f${n}q`),
    a: t(`seo.f${n}a`),
  }));

  const mark = (v: boolean | "partial", label: string) => {
    if (v === "partial") {
      return (
        <span
          role="img"
          aria-label={`${label}: ${t("seo.partial")}`}
          className="mx-auto inline-flex items-center rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-800"
        >
          {t("seo.partial")}
        </span>
      );
    }
    return v ? (
      <span
        role="img"
        aria-label={label}
        className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-emerald-700/[0.1] text-emerald-700"
      >
        <Check size={14} strokeWidth={3} aria-hidden />
      </span>
    ) : (
      <span
        role="img"
        aria-label={label}
        className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-stone-900/[0.06] text-stone-400"
      >
        <X size={14} aria-hidden />
      </span>
    );
  };

  return (
    <div className="mt-16 space-y-16">
      {/* Сравнение */}
      <section aria-labelledby="seo-cmp">
        <h2
          id="seo-cmp"
          className="text-center font-display text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl"
        >
          {t("seo.cmpT")}
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-relaxed text-stone-600">
          {t("seo.cmpD")}
        </p>
        <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-stone-900/10 bg-white shadow-[0_12px_32px_-16px_rgba(28,25,23,0.25)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-900/10 bg-stone-950/[0.02]">
                <th scope="col" className="px-4 py-3.5 text-left font-semibold text-stone-500">
                  <span className="sr-only">Feature</span>
                </th>
                <th scope="col" className="bg-emerald-700/[0.06] px-4 py-3.5 text-center font-bold text-emerald-900">
                  {t("seo.colUs")}
                </th>
                <th scope="col" className="px-4 py-3.5 text-center font-semibold text-stone-700">
                  {t("seo.colDesk")}
                </th>
                <th scope="col" className="px-4 py-3.5 text-center font-semibold text-stone-700">
                  {t("seo.colCloud")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.label} className={i < rows.length - 1 ? "border-b border-stone-900/[0.06]" : ""}>
                  <th scope="row" className="px-4 py-3.5 text-left text-[13px] font-medium text-stone-700">
                    {r.label}
                  </th>
                  <td className="bg-emerald-700/[0.06] px-4 py-3.5 text-center">{mark(r.us, r.label)}</td>
                  <td className="px-4 py-3.5 text-center">{mark(r.desk, r.label)}</td>
                  <td className="px-4 py-3.5 text-center">{mark(r.cloud, r.label)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* честные ограничения — прямота укрепляет доверие */}
        <div className="mx-auto mt-4 flex max-w-3xl items-start gap-2.5 rounded-2xl border border-amber-600/25 bg-amber-50 px-5 py-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
          <div>
            <p className="text-sm font-bold text-amber-900">{t("seo.limitsT")}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-amber-900/80">{t("seo.limitsD")}</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="seo-faq">
        <h2
          id="seo-faq"
          className="text-center font-display text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl"
        >
          {t("seo.faqT")}
        </h2>
        <div className="mx-auto mt-8 max-w-2xl space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-stone-900/10 bg-white shadow-[0_12px_32px_-20px_rgba(28,25,23,0.3)]"
            >
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-stone-900 transition-colors hover:text-emerald-900 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {f.q}
                  <span
                    aria-hidden
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-stone-900/[0.05] text-lg font-normal leading-none text-stone-500 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="border-t border-stone-900/[0.06] px-5 py-4 text-sm leading-relaxed text-stone-600">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
