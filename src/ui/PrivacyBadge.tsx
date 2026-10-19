import { useEffect, useState } from 'react';
import { privacyMeter, type PrivacyMeterSnapshot } from '../privacy/privacy-meter';

type TFn = (key: string, params?: Record<string, string | number>) => string;

export function PrivacyBadge({ t }: { t: TFn }) {
  const [snap, setSnap] = useState<PrivacyMeterSnapshot>(() => privacyMeter.getSnapshot());
  const [open, setOpen] = useState(false);

  useEffect(() => privacyMeter.subscribe(setSnap), []);

  if (!snap.supported) {
    return (
      <div
        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
        title={t('meterTooltip')}
      >
        {t('meterUnsupported')}
      </div>
    );
  }

  const label =
    snap.count === 0
      ? t('meterZero')
      : t('meterCount', { n: snap.count });

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-950">
      <button
        type="button"
        className="font-semibold underline-offset-2 hover:underline"
        title={t('meterTooltip')}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open && snap.count > 0 && (
        <ul className="mt-2 max-h-32 space-y-1 overflow-auto font-mono text-[10px] text-slate-700">
          {snap.urls.map((u) => (
            <li key={u} className="break-all">
              {u}
            </li>
          ))}
        </ul>
      )}
      {open && snap.count === 0 && (
        <p className="mt-1 text-[11px] text-emerald-900">{t('meterTooltip')}</p>
      )}
    </div>
  );
}
