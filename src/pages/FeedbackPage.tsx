import { useI18n, LANG_PATHS } from '../i18n/useI18n';
import { FeedbackModal } from '../ui/FeedbackModal';
import { Sparkles } from 'lucide-react';

export function FeedbackPage() {
  const { lang, setLang, t, languages } = useI18n();

  return (
    <div className="app-shell min-h-screen text-slate-900">
      <header className="header-bar">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <a href={LANG_PATHS[lang]} className="flex items-center gap-2 font-semibold text-slate-900">
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
        <h1 className="text-2xl font-semibold">{t('feedbackTitle')}</h1>
        <p className="mt-2 text-sm text-slate-700">{t('feedbackText')}</p>
        <div className="relative mt-6 min-h-[420px]">
          <FeedbackPageForm t={t} lang={lang} />
        </div>
        <a href={LANG_PATHS[lang]} className="mt-6 inline-block text-sm font-semibold text-blue-700 underline">
          ← {t('backHome')}
        </a>
      </main>
    </div>
  );
}

function FeedbackPageForm({
  t,
  lang,
}: {
  t: (k: string, p?: Record<string, string | number>) => string;
  lang: string;
}) {
  // Reuse modal UI in always-open embedded mode
  return <FeedbackModal open onClose={() => { window.location.href = '/'; }} t={t} lang={lang} />;
}
