import { useEffect, useRef, useState } from "react";
import {
  Bug,
  Check,
  Copy,
  Heart,
  Lightbulb,
  Loader2,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "../i18n";
import { copyTextToClipboard } from "../fs/zipFallback";
import {
  isFeedbackConfigured,
  sendFeedback,
  type FeedbackCategory,
} from "../feedback";

const CATS: { value: FeedbackCategory; icon: LucideIcon }[] = [
  { value: "bug", icon: Bug },
  { value: "idea", icon: Lightbulb },
  { value: "praise", icon: Heart },
];

const MIN_LEN = 10;
const MAX_LEN = 2000;

type Status = "idle" | "sending" | "sent" | "error";

export function FeedbackDialog(props: { open: boolean; onClose: () => void }) {
  const { t, lang } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [category, setCategory] = useState<FeedbackCategory>("idea");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorKey, setErrorKey] = useState("fb.error");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (props.open && !d.open) d.showModal();
    if (!props.open && d.open) d.close();
  }, [props.open]);

  useEffect(() => {
    if (props.open) {
      setStatus("idle");
      setErrorKey("fb.error");
      setCopied(false);
    }
  }, [props.open]);

  const len = message.trim().length;
  const valid = len >= MIN_LEN && message.length <= MAX_LEN;

  const submit = async () => {
    if (status === "sending" || !valid) return;
    if (!isFeedbackConfigured()) {
      setErrorKey("fb.notConfigured");
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      await sendFeedback({ category, message: message.trim(), contact: contact.trim(), lang });
      setStatus("sent");
    } catch (e) {
      setErrorKey(e instanceof Error && e.message === "rate-limited" ? "fb.rateLimit" : "fb.error");
      setStatus("error");
    }
  };

  const copy = async () => {
    const text = `[${category}]\n${message.trim()}${contact.trim() ? `\n— ${contact.trim()}` : ""}`;
    if (await copyTextToClipboard(text)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <dialog ref={ref} className="modal" aria-labelledby="fb-title" onClose={props.onClose}>
      <div className="p-6 sm:p-8">
        {status === "sent" ? (
          <div className="text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-700/[0.08] text-emerald-700">
              <Check size={22} strokeWidth={3} aria-hidden />
            </span>
            <h2 id="fb-title" className="mt-4 font-display text-2xl font-bold tracking-tight text-stone-950">
              {t("fb.sent.t")}
            </h2>
            <p className="mt-2 text-sm text-stone-500">{t("fb.sent.d")}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setContact("");
                  setStatus("idle");
                }}
                className="rounded-xl border border-stone-900/15 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-stone-900/35 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                {t("fb.sendAgain")}
              </button>
              <button
                type="button"
                autoFocus
                onClick={props.onClose}
                className="rounded-xl bg-stone-950 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                {t("fb.close")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 id="fb-title" className="font-display text-2xl font-bold tracking-tight text-stone-950">
              {t("fb.title")}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{t("fb.sub")}</p>

            <fieldset className="mt-5" disabled={status === "sending"}>
              <legend className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                {t("fb.cat.label")}
              </legend>
              <div className="mt-2.5 grid grid-cols-3 gap-2" role="radiogroup" aria-label={t("fb.cat.label")}>
                {CATS.map((c) => (
                  <label
                    key={c.value}
                    className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors has-focus-visible:ring-2 has-focus-visible:ring-emerald-700 ${
                      category === c.value
                        ? "border-emerald-700/50 bg-emerald-700/[0.07] text-emerald-900"
                        : "border-stone-900/10 text-stone-500 hover:border-stone-900/25 hover:text-stone-900"
                    }`}
                  >
                    <input
                      type="radio"
                      name="fb-cat"
                      className="sr-only"
                      checked={category === c.value}
                      onChange={() => setCategory(c.value)}
                    />
                    <c.icon size={14} aria-hidden />
                    {t(`fb.cat.${c.value}`)}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-4">
              <label htmlFor="fb-msg" className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                {t("fb.msg.label")}
              </label>
              <textarea
                id="fb-msg"
                rows={5}
                maxLength={MAX_LEN}
                value={message}
                disabled={status === "sending"}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("fb.msg.ph")}
                className="mt-2 w-full resize-y rounded-xl border border-stone-900/15 bg-white px-3.5 py-3 text-sm leading-relaxed text-stone-900 placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 disabled:opacity-60"
              />
              <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
                <span className={len >= MIN_LEN ? "text-emerald-700" : "text-stone-400"}>
                  {len >= MIN_LEN ? <Check size={11} className="inline" aria-hidden /> : t("fb.min")}
                </span>
                <span className="text-stone-400">
                  {message.length}/{MAX_LEN}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <label htmlFor="fb-contact" className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                {t("fb.contact.label")}
              </label>
              <input
                id="fb-contact"
                type="email"
                autoComplete="email"
                maxLength={120}
                value={contact}
                disabled={status === "sending"}
                onChange={(e) => setContact(e.target.value)}
                placeholder={t("fb.contact.ph")}
                className="mt-2 w-full rounded-xl border border-stone-900/15 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 disabled:opacity-60"
              />
            </div>

            <p className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-700/20 bg-emerald-700/[0.05] px-3 py-2.5 text-xs leading-relaxed text-emerald-900">
              <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden />
              {t("fb.privacy")}
            </p>

            {status === "error" && (
              <p role="alert" className="mt-3 text-sm font-medium text-red-700">
                {t(errorKey)}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={copy}
                disabled={len === 0}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-40"
              >
                {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
                {copied ? t("fb.copied") : t("fb.copy")}
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={props.onClose}
                  disabled={status === "sending"}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-900/15 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-stone-900/35 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-40"
                >
                  <X size={15} aria-hidden />
                  {t("fb.cancel")}
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={!valid || status === "sending"}
                  className="inline-flex items-center gap-2 rounded-xl bg-stone-950 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {status === "sending" ? (
                    <>
                      <Loader2 size={15} className="animate-spin" aria-hidden />
                      {t("fb.sending")}
                    </>
                  ) : (
                    t("fb.send")
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
