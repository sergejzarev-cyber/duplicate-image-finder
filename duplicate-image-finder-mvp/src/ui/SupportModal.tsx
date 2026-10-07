import { Heart, X, ExternalLink } from 'lucide-react';
import { DONATE_URL } from '../config';

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function SupportModal({ open, onClose, t }: SupportModalProps) {
  if (!open) return null;

  const configured = Boolean(DONATE_URL?.trim());

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('supportTitle')}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-[#fffcf8] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t('supportTitle')}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{t('supportText')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={t('supportLater')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="text-xs leading-relaxed text-slate-400">{t('supportNote')}</p>

          {!configured && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
              Donate link is not configured yet. Set DONATE_URL in src/config.ts (PayPal.Me).
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {configured ? (
              <a
                href={DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-accent inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold sm:flex-none"
                onClick={onClose}
              >
                <Heart className="h-4 w-4" />
                {t('supportOpenPaypal')}
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              {t('supportLater')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
