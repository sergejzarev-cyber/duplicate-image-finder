import { useEffect, useState } from "react";
import { I18nProvider, useI18n } from "./i18n";
import { useScanner, type Scanner } from "./hooks/useScanner";
import { useAppHistory } from "./hooks/useAppHistory";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Scanning } from "./components/Scanning";
import { Results } from "./components/Results";
import { DeleteDialog } from "./components/DeleteDialog";
import { DonateDialog } from "./components/DonateDialog";
import { FeedbackDialog } from "./components/FeedbackDialog";
import { Footer } from "./components/Footer";
import { Report } from "./components/Report";
import type { DeleteMode } from "./types";

const WORK_PHASES = new Set(["scanning", "hashing", "dhashing", "measuring", "grouping"]);

function Shell({ s }: { s: Scanner }) {
  const { t } = useI18n();
  const [dlgOpen, setDlgOpen] = useState(false);
  const [dlgWorking, setDlgWorking] = useState(false);
  const [sentCandidates, setSentCandidates] = useState(s.candidates);
  const [fbOpen, setFbOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const { goHome } = useAppHistory({ phase: s.phase, reset: s.reset, cancelScan: s.cancelScan });

  const openDelete = () => {
    setSentCandidates(s.candidates);
    setDlgOpen(true);
  };

  const confirmDelete = async (mode: DeleteMode) => {
    setDlgWorking(true);
    const ok = await s.confirmDeletion(sentCandidates, mode);
    setDlgWorking(false);
    setDlgOpen(false);
    if (!ok) {
      // нет прав на запись — остаёмся в результатах, баннер это покажет
    }
  };

  const phase = s.phase;

  // новый экран — всегда сверху
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [phase]);

  return (
    <div className="relative min-h-screen text-stone-900">
      {/* корпоративная полоска бренда */}
      <div aria-hidden className="biz-topline fixed inset-x-0 top-0 z-50 h-[3px]" />
      {/* фон: сетка + деловые свечения (navy + изумруд) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="bg-grid absolute inset-0" />
        <div className="absolute -top-48 right-[-8%] h-[520px] w-[520px] rounded-full bg-[#0f2a44]/[0.06] blur-[130px]" />
        <div className="absolute top-[30%] left-[-12%] h-[380px] w-[380px] rounded-full bg-emerald-700/[0.06] blur-[130px]" />
        <div className="absolute bottom-[-20%] right-[10%] h-[440px] w-[440px] rounded-full bg-amber-600/[0.07] blur-[130px]" />
      </div>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-stone-950 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        {t("a11y.skip")}
      </a>

      <Header onHome={goHome} canGoHome={phase !== "idle"} onFeedback={() => setFbOpen(true)} />

      <main id="main">
        {phase === "idle" && <Hero s={s} />}

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
          <Scanning
            phase={phase}
            done={s.progress.done}
            total={s.progress.total}
            skipped={0}
          />
        )}

        {phase === "results" && (
          <Results s={s} onOpenDelete={openDelete} onHome={goHome} />
        )}

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

      <FeedbackDialog open={fbOpen} onClose={() => setFbOpen(false)} />
      <DonateDialog open={donateOpen} onClose={() => setDonateOpen(false)} />

      <Footer onFeedback={() => setFbOpen(true)} onDonate={() => setDonateOpen(true)} />
    </div>
  );
}

export default function App() {
  const s = useScanner();
  return (
    <I18nProvider>
      <Shell s={s} />
    </I18nProvider>
  );
}
