import { useCallback, useEffect, useRef } from "react";
import type { Phase } from "../types";

interface Api {
  phase: Phase;
  reset: () => void;
  cancelScan: () => void;
}

/**
 * Навигация через History API:
 * - вход в «результаты» кладёт запись #results — стрелка «назад» ведёт домой,
 *   а не покидает сайт;
 * - «отчёт» ЗАМЕНЯЕТ запись результатов (replaceState), чтобы «назад» из отчёта
 *   вёл домой, а не к устаревшим результатам с уже удалёнными файлами;
 * - кнопка «домой» внутри приложения идёт через history.back(), если есть
 *   наша запись, — стек истории не засоряется.
 */
export function useAppHistory({ phase, reset, cancelScan }: Api) {
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const apiRef = useRef({ reset, cancelScan });
  apiRef.current = { reset, cancelScan };

  // нормализуем базовую запись и слушаем «назад»
  // (юридические якоря #impressum / #datenschutz принадлежат футеру — не трогаем)
  useEffect(() => {
    const LEGAL_HASHES = new Set(["#impressum", "#imprint", "#datenschutz", "#privacy"]);
    // предыдущий хэш: popstate прилетает раньше hashchange,
    // так отличаем «назад из юрдиалога» от «назад из результатов»
    let prevHash = window.location.hash.toLowerCase();
    const onHash = () => {
      prevHash = window.location.hash.toLowerCase();
    };
    try {
      if (!LEGAL_HASHES.has(prevHash)) {
        window.history.replaceState(
          { dupsweep: "home" },
          "",
          window.location.pathname + window.location.search
        );
        prevHash = "";
      }
    } catch {
      /* ignore */
    }
    const onPop = () => {
      // возврат из юридического диалога — пусть обрабатывает футер, скан не сбрасываем
      if (LEGAL_HASHES.has(prevHash) || LEGAL_HASHES.has(window.location.hash.toLowerCase())) {
        prevHash = window.location.hash.toLowerCase();
        return;
      }
      prevHash = window.location.hash.toLowerCase();
      const p = phaseRef.current;
      if (p === "results" || p === "report") {
        apiRef.current.reset();
      } else if (p !== "idle") {
        apiRef.current.cancelScan();
      }
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  // переходы фаз -> история
  const prevRef = useRef<Phase>("idle");
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = phase;
    try {
      if (phase === "results" && prev !== "results") {
        if (window.location.hash !== "#results") {
          if (prev === "report") {
            window.history.replaceState({ dupsweep: "results" }, "", "#results");
          } else {
            window.history.pushState({ dupsweep: "results" }, "", "#results");
          }
        }
      } else if (phase === "report" && prev !== "report") {
        window.history.replaceState({ dupsweep: "report" }, "", "#report");
      }
    } catch {
      /* ignore */
    }
  }, [phase]);

  const goHome = useCallback(() => {
    const hash = window.location.hash;
    if (hash === "#results" || hash === "#report") {
      window.history.back();
      // страховка: если popstate по какой-то причине не сбросил состояние
      window.setTimeout(() => {
        if (phaseRef.current === "results" || phaseRef.current === "report") {
          apiRef.current.reset();
        }
      }, 400);
    } else {
      if (phaseRef.current !== "idle") apiRef.current.cancelScan();
      apiRef.current.reset();
    }
  }, []);

  return { goHome };
}
