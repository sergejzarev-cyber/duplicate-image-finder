import { useState } from 'react';
import { Share2, Copy, Mail, Check } from 'lucide-react';

type TFn = (key: string, params?: Record<string, string | number>) => string;

export function SendToDesktop({ t }: { t: TFn }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/app` : '/app';
  const title = t('brand');
  const text = t('sendToPcShareText');

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleShare = async () => {
    try {
      if (canShare) {
        await navigator.share({ title, text, url });
        return;
      }
      await copy();
    } catch {
      // user cancelled share — ignore
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — fallback: prompt
      window.prompt(t('sendToPcCopyFallback'), url);
    }
  };

  const mailHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">{t('sendToPcTitle')}</div>
      <p className="mt-1 text-sm leading-relaxed text-slate-700">{t('sendToPcText')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="btn-accent inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          <Share2 className="h-4 w-4" />
          {t('sendToPcButton')}
        </button>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-700" /> : <Copy className="h-4 w-4" />}
          {copied ? t('sendToPcCopied') : t('sendToPcCopy')}
        </button>
        <a
          href={mailHref}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800"
        >
          <Mail className="h-4 w-4" />
          {t('sendToPcEmail')}
        </a>
      </div>
      <p className="mt-2 break-all font-mono text-[11px] text-slate-500">{url}</p>
    </div>
  );
}
