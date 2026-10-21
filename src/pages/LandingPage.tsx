import { useI18n, LANG_PATHS } from '../i18n/useI18n';
import type { Lang } from '../i18n/dict';
import { DONATE_URL } from '../config';
import { Heart, MessageSquareHeart, Sparkles, ArrowRight, Play } from 'lucide-react';
import { useState } from 'react';
import { imprintHtml, privacyHtml, contactHtml } from '../legal/content';

type LegalPage = null | 'imprint' | 'privacy' | 'contact';

export function LandingPage({ fixedLang }: { fixedLang: Lang }) {
  const { lang, t, languages } = useI18n(fixedLang);
  const [legalPage, setLegalPage] = useState<LegalPage>(null);

  return (
    <div className="app-shell min-h-screen text-slate-900">
      <header className="header-bar sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="logo-mark flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-sky-500 text-white shadow-lg shadow-blue-700/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-slate-900">{t('brand')}</div>
              <div className="text-[11px] font-medium text-slate-700">{t('privacyBadge')}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/feedback"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              <MessageSquareHeart className="h-3.5 w-3.5 text-blue-700" />
              {t('feedback')}
            </a>
            <a
              href="/verify"
              className="hidden rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-800 shadow-sm hover:bg-slate-50 sm:inline-flex"
            >
              {t('verifyNav')}
            </a>
            {/* Real links per language → separate indexable URLs with hreflang */}
            <nav className="flex rounded-full border border-slate-300 bg-white p-1 shadow-sm" aria-label="Language">
              {languages.map((l) => (
                <a
                  key={l.code}
                  href={LANG_PATHS[l.code]}
                  hrefLang={l.code}
                  lang={l.code}
                  aria-current={lang === l.code ? 'page' : undefined}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                    lang === l.code ? 'bg-slate-900 text-white' : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {l.code.toUpperCase()}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-10 md:py-14">
        {/* Hero */}
        <section className="glass anim-rise overflow-hidden rounded-[28px] p-7 md:p-10">
          <div className="grid items-center gap-8 md:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl md:leading-[1.08]">
                {t('heroTitle')}
              </h1>
              <p className="mt-3 text-base font-semibold text-emerald-800 md:text-lg">{t('heroTagline')}</p>
              <p className="mt-3 max-w-lg text-base leading-relaxed text-slate-700">{t('heroText')}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/app" className="btn-accent inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold">
                  {t('openScanner')}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/app?demo=1"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                >
                  <Play className="h-4 w-4 text-blue-700" />
                  {t('tryDemo')}
                </a>
              </div>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-700">{t('landingScannerNote')}</p>
            </div>

            {/* Privacy card — short bullets + demo pair */}
            <div className="relative anim-rise-delay-1">
              <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white p-5 shadow-xl">
                <div className="mb-3 text-sm font-semibold text-slate-900">{t('privacyCardTitle')}</div>
                <ul className="mb-4 space-y-2 text-sm leading-relaxed text-slate-800">
                  <li>• {t('privacyCard1')}</li>
                  <li>• {t('privacyCard2')}</li>
                  <li>• {t('privacyCard3')}</li>
                </ul>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-800">
                    {t('demoBadge')}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    98% {t('demoSimilar')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="overflow-hidden rounded-2xl border-2 border-emerald-400">
                    <img src="/images/demo-pair-base.jpg" alt="" className="h-24 w-full object-cover" />
                    <div className="bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-slate-800">{t('demoKeep')}</div>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <img
                      src="/images/demo-pair-base.jpg"
                      alt=""
                      className="h-24 w-full object-cover opacity-90"
                      style={{ filter: 'contrast(0.95) saturate(0.9)' }}
                    />
                    <div className="bg-white px-3 py-2 text-[11px] font-semibold text-slate-700">{t('demoRemove')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="card-soft rounded-3xl p-6 md:p-8">
          <h2 className="text-lg font-semibold text-slate-900">{t('seoHowTitle')}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[t('seoHow1'), t('seoHow2'), t('seoHow3')].map((text, i) => (
              <div key={text} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed text-slate-800">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Honest limits + balanced comparison */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="card-soft rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-slate-900">{t('honestTitle')}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-800">
              <li className="flex gap-2"><span className="font-bold text-slate-500">1.</span>{t('honest1')}</li>
              <li className="flex gap-2"><span className="font-bold text-slate-500">2.</span>{t('honest2')}</li>
              <li className="flex gap-2"><span className="font-bold text-slate-500">3.</span>{t('honest3')}</li>
            </ul>
          </div>
          <div className="card-soft rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-slate-900">{t('compareTitle')}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-700">
                    <th className="py-2 pr-2 font-semibold">{t('compareColFeature')}</th>
                    <th className="py-2 pr-2 font-semibold">DupSweep</th>
                    <th className="py-2 pr-2 font-semibold">{t('compareColDesktop')}</th>
                    <th className="py-2 font-semibold">{t('compareColCloud')}</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 pr-2">{t('compareRowInstall')}</td>
                    <td className="py-2.5 pr-2 font-semibold text-emerald-700">✓</td>
                    <td className="py-2.5 pr-2">✗</td>
                    <td className="py-2.5 font-semibold text-emerald-700">✓</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 pr-2">{t('compareRowAccount')}</td>
                    <td className="py-2.5 pr-2 font-semibold text-emerald-700">✓</td>
                    <td className="py-2.5 pr-2">✓</td>
                    <td className="py-2.5">✗</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 pr-2">{t('compareRowExactSimilar')}</td>
                    <td className="py-2.5 pr-2 font-semibold text-emerald-700">✓</td>
                    <td className="py-2.5 pr-2 font-semibold text-emerald-700">✓</td>
                    <td className="py-2.5">{t('comparePartial')}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-2">{t('compareRowLarge')}</td>
                    <td className="py-2.5 pr-2 font-semibold text-rose-700">✗</td>
                    <td className="py-2.5 pr-2 font-semibold text-emerald-700">✓</td>
                    <td className="py-2.5">{t('comparePartial')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-700">{t('compareNote')}</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="card-soft rounded-3xl p-6 md:p-8">
          <h2 className="text-lg font-semibold text-slate-900">{t('seoFaqTitle')}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {(
              [
                ['seoFaq1q', 'seoFaq1a'],
                ['seoFaq2q', 'seoFaq2a'],
                ['seoFaq3q', 'seoFaq3a'],
                ['seoFaq4q', 'seoFaq4a'],
                ['seoFaq5q', 'seoFaq5a'],
              ] as const
            ).map(([q, a]) => (
              <div key={q}>
                <div className="text-sm font-semibold text-slate-900">{t(q)}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{t(a)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="rounded-3xl border border-slate-200 bg-slate-900 px-6 py-8 text-center text-white shadow-xl">
          <h2 className="text-xl font-semibold md:text-2xl">{t('finalCtaTitle')}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">{t('finalCtaText')}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a href="/app" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100">
              {t('openScanner')}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/app?demo=1"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-500 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Play className="h-4 w-4" />
              {t('tryDemo')}
            </a>
          </div>
        </section>
      </main>

      {legalPage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-[28px] border bg-white p-6 shadow-2xl">
            <div className="mb-4 flex justify-between gap-3">
              <h2 className="text-xl font-semibold">
                {legalPage === 'imprint' ? t('footerImprint') : legalPage === 'privacy' ? t('footerPrivacy') : t('footerContact')}
              </h2>
              <button type="button" className="rounded-xl border px-3 py-1.5 text-sm font-semibold" onClick={() => setLegalPage(null)}>
                {t('legalBack')}
              </button>
            </div>
            <div
              className="legal-prose"
              dangerouslySetInnerHTML={{
                __html:
                  legalPage === 'imprint' ? imprintHtml(lang) : legalPage === 'privacy' ? privacyHtml(lang) : contactHtml(lang),
              }}
            />
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-slate-900">
            <button type="button" onClick={() => setLegalPage('imprint')}>{t('footerImprint')}</button>
            <button type="button" onClick={() => setLegalPage('privacy')}>{t('footerPrivacy')}</button>
            <a href="/feedback">{t('feedback')}</a>
            <a href="/verify">{t('verifyNav')}</a>
            <a href="https://github.com/sergejzarev-cyber/duplicate-image-finder" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            {DONATE_URL && (
              <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" className="text-rose-800">
                <Heart className="mr-1 inline h-3.5 w-3.5" />
                {t('footerSupport')}
              </a>
            )}
          </div>
          <div className="text-sm font-semibold text-slate-800">© {new Date().getFullYear()} DupSweep</div>
        </div>
      </footer>
    </div>
  );
}
