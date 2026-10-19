import { useEffect, useRef, useState } from "react";
import { I18nProvider, useI18n } from "./i18n";
import { useScanner, type Scanner } from "./hooks/useScanner";
import { useAppHistory } from "./hooks/useAppHistory";
import { Header } from "./components/Header";
import { ScannerStart } from "./components/ScannerStart";
import { Scanning } from "./components/Scanning";
import { Results } from "./components/Results";
import { DeleteDialog } from "./components/DeleteDialog";
import { Footer } from "./components/Footer";
import { Report } from "./components/Report";
import type { DeleteMode } from "./types";

const WORK_PHASES = new Set(["scanning", "hashing", "dhashing", "measuring", "grouping"]);

function Shell({ s }: { s: Scanner }) {
  const { t } = useI18n();
  const [dlgOpen, setDlgOpen] = useState(false);
  const [dlgWorking, setDlgWorking] = useState(false);
  const [sentCandidates, setSentCandidates] = useState(s.candidates);
  const { goHome } = useAppHistory({ phase: s.phase, reset: s.reset, cancelScan: s.cancelScan });

  // /app?demo=1 — автозапуск демо (ссылка с лендинга). Параметр сразу чистим.
  const demoStarted = useRef(false);
  useEffect(() => {
    if (demoStarted.current) return;
    try {
      if (new URLSearchParams(window.location.search).get("demo") === "1") {
        demoStarted.current = true;
        window.history.replaceState(null, "", window.location.pathname);
        void s.runDemo();
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDelete = () => {
    setSentCandidates(s.candidates);
    setDlgOpen(true);
  };

  const confirmDelete = async (mode: DeleteMode) => {
    setDlgWorking(true);
    await s.confirmDeletion(sentCandidates, mode);
    setDlgWorking(false);
    setDlgOpen(false);
  };

  const phase = s.phase;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [phase]);

  return (
    <div className="relative min-h-screen text-stone-900">
      <div aria-hidden className="biz-topline fixed inset-x-0 top-0 z-50 h-[3px]" />
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="bg-grid absolute inset-0" />
        <div className="absolute -top-48 right-[-8%] h-[520px] w-[520px] rounded-full bg-[#0f2a44]/[0.06] blur-[130px]" />
        <div className="absolute bottom-[-20%] right-[10%] h-[440px] w-[440px] rounded-full bg-amber-600/[0.07] blur-[130px]" />
      </div>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-stone-950 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        {t("a11y.skip")}
      </a>

      <Header homeHref="/" feedbackHref="/feedback" feedbackNewTab canGoHome={false} onHome={goHome} onFeedback={() => {}} />

      <main id="main">
        {phase === "idle" && <ScannerStart s={s} />}

        {WORK_PHASES.has(phase) && (
          <Scanning
            phase={phase}
            done={s.progress.done}
            total={s.progress.total}
            skipped={s.scanErrors.length}
            onCancel={s.cancelScan}
          />
        )}

        {phase === "deleting" && (
          <Scanning phase={phase} done={s.progress.done} total={s.progress.total} skipped={0} />
        )}

        {phase === "results" && <Results s={s} onOpenDelete={openDelete} onHome={goHome} />}

        {phase === "report" && s.report && (
          <Report report={s.report} onAgain={goHome} onRescan={s.rescan} onHome={goHome} />
        )}
      </main>

      <DeleteDialog
        open={dlgOpen}
        count={sentCandidates.length}
        bytes={sentCandidates.reduce((sum, c) => sum + c.file.size, 0)}
        similarCount={sentCandidates.filter((c) => c.kind === "similar").length}
        working={dlgWorking}
        progress={s.progress}
        onCancel={() => setDlgOpen(false)}
        onConfirm={confirmDelete}
      />

      <Footer external onFeedback={() => {}} onDonate={() => {}} />
    </div>
  );
}

export default function ScannerApp() {
  const s = useScanner();
  return (
    <I18nProvider>
      <Shell s={s} />
    </I18nProvider>
  );
}
