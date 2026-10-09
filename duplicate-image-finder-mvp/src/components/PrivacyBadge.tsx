import { useSyncExternalStore } from "react";
import { AlertTriangle, Info, ShieldCheck } from "lucide-react";
import { useI18n } from "../i18n";
import { privacyMeter } from "../lib/privacyMeter";

/**
 * Бейдж счётчика сети на экране результатов.
 * count > 0 — всегда со списком URL, ничего не прячем.
 */
export function PrivacyBadge() {
  const { t } = useI18n();
  const snap = useSyncExternalStore(
    privacyMeter.subscribe,
    privacyMeter.getSnapshot,
    privacyMeter.getSnapshot
  );

  if (!snap.started) return null;

  if (!snap.supported) {
    return (
      <p className="inline-flex items-center gap-1.5 rounded-full border border-stone-900/10 bg-white px-3 py-1.5 text-xs font-medium text-stone-500">
        <Info size={13} aria-hidden />
        {t("meter.unsupported")}
      </p>
    );
  }

  if (snap.count === 0) {
    return (
      <p
        title={t("meter.tip")}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/25 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900"
      >
        <ShieldCheck size={13} aria-hidden />
        {t("meter.zero")}
      </p>
    );
  }

  return (
    <details className="rounded-2xl border border-amber-600/25 bg-amber-50 px-4 py-3">
      <summary
        title={t("meter.tip")}
        className="cursor-pointer text-xs font-semibold text-amber-900"
      >
        <span className="inline-flex items-center gap-1.5">
          <AlertTriangle size={13} aria-hidden />
          {t("meter.some", { n: snap.count })}
        </span>
      </summary>
      <ul className="mt-2 max-h-32 space-y-1 overflow-auto">
        {snap.urls.map((u, i) => (
          <li key={`${u}-${i}`} className="break-all font-mono text-[10px] text-amber-900/80">
            {u}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-relaxed text-amber-900/70">{t("meter.tip")}</p>
      <a
        href="/verify"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-block text-[11px] font-semibold text-amber-900 underline underline-offset-2"
      >
        {t("foot.verify")}
      </a>
    </details>
  );
}
