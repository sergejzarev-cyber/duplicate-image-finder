import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { I18nProvider } from "./i18n";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { FeedbackPage } from "./components/FeedbackPage";

function FeedbackShell() {
  return (
    <div className="relative min-h-screen text-stone-900">
      <div aria-hidden className="biz-topline fixed inset-x-0 top-0 z-50 h-[3px]" />
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="bg-grid absolute inset-0" />
        <div className="absolute -top-48 right-[-8%] h-[520px] w-[520px] rounded-full bg-[#0f2a44]/[0.06] blur-[130px]" />
      </div>
      <Header homeHref="/" hideFeedback canGoHome={false} onHome={() => {}} onFeedback={() => {}} />
      <main id="main">
        <FeedbackPage />
      </main>
      <Footer onFeedback={() => window.scrollTo({ top: 0 })} onDonate={() => {}} hideFeedbackLink />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <FeedbackShell />
    </I18nProvider>
  </StrictMode>
);
