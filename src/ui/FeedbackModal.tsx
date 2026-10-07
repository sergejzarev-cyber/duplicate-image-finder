import { useState } from 'react';
import { MessageSquareHeart, X, CheckCircle2, Copy, Send } from 'lucide-react';
import { FEEDBACK_FORMSPREE_ENDPOINT } from '../config';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  lang: string;
}

export function FeedbackModal({ open, onClose, t, lang }: FeedbackModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error' | 'copied'>('idle');
  const configured = Boolean(FEEDBACK_FORMSPREE_ENDPOINT?.trim());

  if (!open) return null;

  const resetAndClose = () => {
    setStatus('idle');
    onClose();
  };

  const composedBody = () =>
    [
      `Dedup Studio feedback (${lang})`,
      name ? `Name: ${name}` : '',
      email ? `Reply-to: ${email}` : '',
      '',
      message.trim(),
    ]
      .filter(Boolean)
      .join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(composedBody());
      setStatus('copied');
    } catch {
      setStatus('error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (!configured) {
      await handleCopy();
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch(FEEDBACK_FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: name.trim() || 'Anonymous',
          email: email.trim() || undefined,
          message: message.trim(),
          language: lang,
          _subject: `Dedup Studio feedback (${lang})`,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setStatus('success');
      setMessage('');
      setName('');
      setEmail('');
    } catch (err) {
      console.error('Feedback send failed', err);
      setStatus('error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-stone-900/40 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('feedbackTitle')}
      onClick={(e) => {
        if (e.target === e.currentTarget) resetAndClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/70 bg-[#fffcf8] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
              <MessageSquareHeart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900">{t('feedbackTitle')}</h2>
              <p className="mt-1 text-sm leading-relaxed text-stone-500">{t('feedbackText')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            aria-label={t('feedbackClose')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-stone-600">
              {t('feedbackName')}
              <input
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none ring-amber-600/30 focus:ring-2"
                autoComplete="name"
              />
            </label>
            <label className="block text-xs font-semibold text-stone-600">
              {t('feedbackEmail')}
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none ring-amber-600/30 focus:ring-2"
                autoComplete="email"
              />
            </label>
          </div>

          <label className="block text-xs font-semibold text-stone-600">
            {t('feedbackMessage')}
            <textarea
              required
              name="message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('feedbackPlaceholder')}
              className="mt-1.5 w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none ring-amber-600/30 focus:ring-2"
            />
          </label>

          <p className="text-[11px] leading-relaxed text-stone-400">{t('feedbackPrivacy')}</p>

          {status === 'success' && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {t('feedbackSuccess')}
            </div>
          )}
          {status === 'error' && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {t('feedbackError')}
            </div>
          )}
          {status === 'copied' && (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
              {t('feedbackCopied')}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={status === 'sending' || !message.trim()}
              className="btn-accent inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50 sm:flex-none"
            >
              <Send className="h-4 w-4" />
              {status === 'sending' ? t('feedbackSending') : t('feedbackSend')}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              <Copy className="h-4 w-4" />
              {t('feedbackCopy')}
            </button>
            <button
              type="button"
              onClick={resetAndClose}
              className="inline-flex items-center rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-600 hover:bg-stone-50"
            >
              {t('feedbackClose')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
