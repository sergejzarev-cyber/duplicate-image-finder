import { useI18n, LANG_PATHS } from '../i18n/useI18n';
import { ShieldCheck, Sparkles } from 'lucide-react';

export function VerifyPage() {
  const { lang, setLang, t, languages } = useI18n();

  return (
    <div className="app-shell min-h-screen text-slate-900">
      <header className="header-bar">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <a href={LANG_PATHS[lang]} className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-blue-700" />
            {t('brand')}
          </a>
          <div className="flex gap-1 rounded-full border border-slate-300 bg-white p-1">
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  lang === l.code ? 'bg-slate-900 text-white' : 'text-slate-700'
                }`}
              >
                {l.code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t('verifyNav')}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{t('verifyTitle')}</h1>
        <p className="mt-3 text-base leading-relaxed text-slate-700">{t('verifyIntro')}</p>

        <ol className="mt-8 space-y-5">
          {[
            t('verifyStep1'),
            t('verifyStep2'),
            t('verifyStep3'),
            t('verifyStep4'),
          ].map((step, i) => (
            <li key={i} className="card-soft flex gap-3 rounded-2xl p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-slate-800">{step}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
          {t('verifyLimits')}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/app" className="btn-accent rounded-2xl px-5 py-3 text-sm font-semibold">
            {t('openScanner')}
          </a>
          <a
            href="https://github.com/sergejzarev-cyber/duplicate-image-finder"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
          >
            GitHub
          </a>
          <a href={LANG_PATHS[lang]} className="rounded-2xl px-5 py-3 text-sm font-semibold text-blue-700 underline">
            {t('backHome')}
          </a>
        </div>

        <p className="mt-10 text-xs text-slate-600">lang: {lang.toUpperCase()}</p>
      </main>
    </div>
  );
}
