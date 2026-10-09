import { Check, ChevronRight, House } from "lucide-react";
import { useI18n } from "../i18n";

/** Хлебные крошки: Главная / Текущая страница */
export function Crumbs(props: { current: string; onHome: () => void }) {
  const { t } = useI18n();
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1.5 text-[13px]">
        <li>
          <button
            type="button"
            onClick={props.onHome}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-stone-700 transition-colors hover:bg-stone-900/5 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <House size={14} aria-hidden />
            {t("crumb.home")}
          </button>
        </li>
        <li aria-hidden>
          <ChevronRight size={14} className="text-stone-400" />
        </li>
        <li aria-current="page" className="px-1 font-semibold text-stone-900">
          {props.current}
        </li>
      </ol>
    </nav>
  );
}

/** Степпер процесса: 1 Сканирование → 2 Проверка → 3 Готово */
export function Steps(props: { current: 2 | 3 }) {
  const { t } = useI18n();
  const steps = [t("steps.scan"), t("steps.review"), t("steps.done")];
  return (
    <ol aria-label="Progress" className="flex items-center gap-2 sm:gap-3">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < props.current;
        const active = n === props.current;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            {i > 0 && (
              <span
                aria-hidden
                className={`h-px w-6 sm:w-10 ${done || active ? "bg-emerald-700/50" : "bg-stone-900/10"}`}
              />
            )}
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className={`grid h-6 w-6 place-items-center rounded-full border text-[11px] font-bold tabular-nums ${
                  done
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : active
                      ? "border-stone-950 bg-stone-950 text-white ring-4 ring-stone-950/10"
                      : "border-stone-900/25 bg-white text-stone-600"
                }`}
              >
                {done ? <Check size={12} strokeWidth={3} /> : n}
              </span>
              <span
                className={`hidden text-xs font-semibold sm:inline ${
                  done || active ? "text-stone-900" : "text-stone-600"
                }`}
              >
                {label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
