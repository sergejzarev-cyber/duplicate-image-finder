import { useEffect, useState } from "react";
import { Check, ImageOff, Trash2, X } from "lucide-react";
import { useI18n } from "../i18n";
import { formatBytes, formatDate } from "../lib/format";
import { pctBadgeClass, similarityPct } from "../core/similarity";
import type { DuplicateGroup, ImageFile } from "../types";

function BigThumb({ file }: { file: ImageFile }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const src = file.decodedBlob ?? file.blob;
  useEffect(() => {
    if (file.broken) return;
    setFailed(false);
    const u = URL.createObjectURL(src);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [src, file.broken]);

  if (file.broken || !url || failed) {
    return (
      <div className="grid h-full w-full place-items-center bg-stone-100">
        <ImageOff size={28} className="text-stone-300" aria-hidden />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={file.name}
      loading="eager"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-contain bg-stone-950/[0.03]"
    />
  );
}

/** Модалка «Сравнить»: вся группа крупно, выбор «оставить» работает прямо здесь. */
export function CompareDialog(props: {
  group: DuplicateGroup;
  index: number;
  keepId: string | null;
  onKeep: (gid: string, fid: string) => void;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const { group } = props;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [props.onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("res.groupAria", { n: props.index })}
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div aria-hidden className="absolute inset-0 bg-stone-950/55 backdrop-blur-sm" />
      <div className="rise relative max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl border border-stone-900/10 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-stone-900/10 bg-white/95 px-5 py-3.5 backdrop-blur">
          <p className="text-sm font-semibold text-stone-900">
            {t("res.cmpTitle", { n: props.index })}
            <span className="ml-2 font-normal text-stone-500">
              {t("res.cmpMatch", { pct: similarityPct(Math.min(...(group.dists ?? [group.maxDist ?? 0]))) })}
            </span>
          </p>
          <button
            type="button"
            onClick={props.onClose}
            autoFocus
            aria-label={t("fb.close")}
            className="grid h-8 w-8 place-items-center rounded-lg text-stone-500 transition-colors hover:bg-stone-900/5 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <X size={17} aria-hidden />
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {group.files.map((f, i) => {
            const kept = props.keepId === f.id;
            const dist = group.dists?.[i];
            const pct = dist === undefined ? null : similarityPct(dist);
            return (
              <label
                key={f.id}
                className={f.broken ? "block cursor-not-allowed" : "block cursor-pointer"}
              >
                <input
                  type="radio"
                  name={`cmp-keep-${group.id}`}
                  className="peer sr-only"
                  checked={kept}
                  disabled={f.broken}
                  onChange={() => props.onKeep(group.id, f.id)}
                  aria-label={`${t("res.keep")}: ${f.name}`}
                />
                <div
                  className={`overflow-hidden rounded-xl border bg-white transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-700 ${
                    kept
                      ? "border-emerald-600 shadow-[0_10px_30px_-12px_rgba(4,120,87,0.5)] ring-1 ring-emerald-600"
                      : "border-stone-900/10 hover:border-stone-900/30"
                  } ${f.broken ? "opacity-60" : ""}`}
                >
                  <div className="relative aspect-[4/3]">
                    <BigThumb file={f} />
                    <span className="absolute left-2 top-2 flex gap-1.5" aria-hidden>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide shadow ${
                          kept ? "bg-emerald-600 text-white" : "bg-red-600/95 text-white"
                        }`}
                      >
                        {kept ? <Check size={11} strokeWidth={3} /> : <Trash2 size={11} />}
                        {kept ? t("res.keep") : t("res.remove")}
                      </span>
                      {pct !== null && (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 font-mono text-[10px] font-bold shadow ${pctBadgeClass(pct)}`}
                        >
                          {pct}%
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="space-y-1 border-t border-stone-900/8 p-3">
                    <p className="truncate text-xs font-semibold text-stone-900" title={f.name}>
                      {f.name}
                    </p>
                    <p className="truncate font-mono text-[10px] text-stone-500" title={f.path}>
                      {f.path}
                    </p>
                    <p className="font-mono text-[10px] text-stone-500">
                      {formatBytes(f.size, lang)}
                      {f.width ? ` · ${f.width}×${f.height}` : ""}
                      {` · ${formatDate(f.lastModified, lang)}`}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
