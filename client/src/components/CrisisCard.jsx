import { useState } from "react";
import { HeartHandshake } from "lucide-react";
import { t } from "../i18n/strings.js";

/**
 * Full-screen RED-tier crisis card. Deliberately the most visually distinct
 * screen in the app — and deliberately theme-independent: it always shows
 * the same solid, high-contrast red regardless of whether light or dark
 * mode is active, so the signal never gets softened by a color preference.
 * No way to dismiss it except the explicit "I'm safe now" action (which
 * itself doesn't hide any real danger; it just lets the person return to
 * the app when ready).
 */
export default function CrisisCard({ lang, actions, onSafeNow, onReferralClick }) {
  const [confirming, setConfirming] = useState(false);

  const handleAction = (action) => {
    onReferralClick?.();
    if (action.type === "call") window.location.href = `tel:${action.value.replace(/\s+/g, "")}`;
    if (action.type === "whatsapp") window.location.href = `https://wa.me/${action.value.replace(/\D/g, "")}`;
    if (action.type === "sms") window.location.href = `sms:${action.value}`;
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-center safe-t safe-b bg-[#fee2e2]"
    >
      <div className="max-w-sm w-full">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#dc2626] flex items-center justify-center mb-4 shadow-lg">
          <HeartHandshake size={30} color="white" strokeWidth={2.25} />
        </div>
        <h1 className="text-2xl font-extrabold text-[#7f1d1d] mb-3">{t(lang, "crisisHeading")}</h1>
        <p className="text-sm text-[#7f1d1d]/80 mb-6">
          {lang === "sn"
            ? "Trinda pane rimwe rezvinotevera kuti utaure nemunhu izvozvi:"
            : lang === "nd"
            ? "Cindezela kolunye lwalezi ukuze ukhulume nomuntu manje:"
            : "Tap any of these to talk to a real person right now:"}
        </p>

        <div className="space-y-3 mb-6">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => handleAction(a)}
              className="w-full rounded-xl bg-[#dc2626] text-white font-bold py-4 text-base shadow-md active:scale-[0.98] transition-transform"
            >
              {a.label}
            </button>
          ))}
        </div>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="text-sm underline text-[#7f1d1d]/70 hover:text-[#7f1d1d] font-medium"
          >
            {t(lang, "crisisLockLabel")}
          </button>
        ) : (
          <div className="rounded-xl bg-white/70 p-4">
            <p className="text-sm mb-3 text-[#7f1d1d]">
              {lang === "sn"
                ? "Unonzwa wakachengeteka izvozvi here?"
                : lang === "nd"
                ? "Uzizwa uphephile manje?"
                : "Do you feel safe right now?"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onSafeNow}
                className="flex-1 rounded-full bg-[#15803d] text-white py-2 text-sm font-semibold"
              >
                {lang === "sn" ? "Hongu" : lang === "nd" ? "Yebo" : "Yes"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-full bg-[#7f1d1d]/10 text-[#7f1d1d] py-2 text-sm font-semibold"
              >
                {lang === "sn" ? "Kwete" : lang === "nd" ? "Cha" : "Not yet"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
