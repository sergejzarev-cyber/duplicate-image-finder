import { useEffect, useRef, useState } from "react";
import { ExternalLink, Heart, ShieldCheck, X } from "lucide-react";
import { useI18n } from "../i18n";
import {
  DONATE_AMOUNTS,
  DONATE_MAX,
  DONATE_MIN,
  buildDonateUrl,
  isDonateConfigured,
  openDonate,
} from "../lib/donate";

export function DonateDialog(props: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [amount, setAmount] = useState<number>(DONATE_AMOUNTS[1]);
  const [custom, setCustom] = useState("");
  const [customActive, setCustomActive] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (props.open && !d.open) d.showModal();
    if (!props.open && d.open) d.close();
  }, [props.open]);

  useEffect(() => {
    if (props.open) {
      setAmount(DONATE_AMOUNTS[1]);
      setCustom("");
      setCustomActive(false);
    }
  }, [props.open]);

  const configured = isDonateConfigured();
  const customNum = Math.round(Number(custom.replace(",", ".")) || 0);
  const customValid = customNum >= DONATE_MIN && customNum <= DONATE_MAX;
  const effective = customActive ? (customValid ? customNum : 0) : amount;
  const previewUrl = configured && effective > 0 ? buildDonateUrl(effective) : "";

  return (
    <dialog ref={ref} className="modal" aria-labelledby="donate-title" onClose={props.onClose}>
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/[0.12] text-amber-700">
            <Heart size={22} aria-hidden />
          </span>
          <button
            type="button"
            onClick={props.onClose}
            aria-label={t("donate.cancel")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-stone-900/5 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <X size={17} aria-hidden />
          </button>
        </div>

        <h2
          id="donate-title"
          className="mt-4 font-display text-2xl font-bold tracking-tight text-stone-950"
        >
          {t("donate.title")}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{t("donate.sub")}</p>

        {!configured ? (
          <p role="alert" className="mt-5 rounded-xl border border-amber-600/25 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            {t("donate.notConfigured")}
          </p>
        ) : (
          <>
            <fieldset className="mt-5">
              <legend className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                {t("donate.amount")}
              </legend>
              <div className="mt-2.5 grid grid-cols-3 gap-2" role="radiogroup" aria-label={t("donate.amount")}>
                {DONATE_AMOUNTS.map((a) => {
                  const active = !customActive && amount === a;
                  return (
                    <label
                      key={a}
                      className={`cursor-pointer rounded-xl border px-2 py-3 text-center transition-colors has-focus-visible:ring-2 has-focus-visible:ring-emerald-700 ${
                        active
                          ? "border-emerald-700/50 bg-emerald-700/[0.07] text-emerald-900"
                          : "border-stone-900/10 text-stone-600 hover:border-stone-900/25"
                      }`}
                    >
                      <input
                        type="radio"
                        name="donate-amount"
                        className="sr-only"
                        checked={active}
                        onChange={() => {
                          setCustomActive(false);
                          setAmount(a);
                        }}
                      />
                      <span className="font-display text-lg font-bold tabular-nums">€{a}</span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="donate-custom-check"
                  className="h-4 w-4 shrink-0 accent-emerald-700"
                  checked={customActive}
                  onChange={(e) => setCustomActive(e.target.checked)}
                />
                <label htmlFor="donate-custom-input" className="text-xs font-medium text-stone-600">
                  {t("donate.custom")} (€{DONATE_MIN}–€{DONATE_MAX})
                </label>
                <div className="relative ml-auto w-28">
                  <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                    €
                  </span>
                  <input
                    id="donate-custom-input"
                    type="number"
                    inputMode="numeric"
                    min={DONATE_MIN}
                    max={DONATE_MAX}
                    value={custom}
                    disabled={!customActive}
                    onChange={(e) => setCustom(e.target.value)}
                    placeholder="25"
                    className="w-full rounded-xl border border-stone-900/15 bg-white py-2 pl-7 pr-3 text-sm font-semibold tabular-nums text-stone-900 placeholder:font-normal placeholder:text-stone-300 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 disabled:opacity-40"
                  />
                </div>
              </div>
              {customActive && custom !== "" && !customValid && (
                <p className="mt-1.5 text-xs font-medium text-red-700">
                  €{DONATE_MIN}–€{DONATE_MAX}
                </p>
              )}
            </fieldset>

            {previewUrl && (
              <p className="mt-3 truncate font-mono text-[11px] text-stone-400" title={previewUrl}>
                {previewUrl.replace(/^https:\/\//, "")}
              </p>
            )}

            <p className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-700/20 bg-emerald-700/[0.05] px-3 py-2.5 text-xs leading-relaxed text-emerald-900">
              <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden />
              {t("donate.note")}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={props.onClose}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-900/15 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-stone-900/35 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                {t("donate.cancel")}
              </button>
              <button
                type="button"
                onClick={() => effective > 0 && openDonate(effective)}
                disabled={effective <= 0}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0070ba] px-6 py-2.5 text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(0,112,186,0.7)] transition-all hover:bg-[#005ea6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070ba] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Heart size={15} aria-hidden />
                {t("donate.cta")}
                <ExternalLink size={13} aria-hidden className="opacity-70" />
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
