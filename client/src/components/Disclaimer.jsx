import { ShieldCheck } from "lucide-react";
import { t } from "../i18n/strings.js";

export default function Disclaimer({ lang, onAccept }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 safe-b">
      <div className="w-full max-w-md rounded-xl3 card bg-surface p-6 shadow-soft animate-fade-up">
        <div className="w-11 h-11 rounded-xl bg-brand-2/15 flex items-center justify-center mb-3">
          <ShieldCheck size={20} className="text-brand-2" strokeWidth={2.2} />
        </div>
        <h2 className="text-lg font-bold text-ink mb-1">{t(lang, "appName")}</h2>
        <p className="text-sm text-ink/70 mb-4">{t(lang, "tagline")}</p>
        <p className="text-sm leading-relaxed text-ink/90 bg-surface2 rounded-xl p-3 mb-4 border border-border">
          {t(lang, "disclaimer")}
        </p>
        <p className="text-xs text-ink/55 mb-5">
          No name, phone number, or IP address is ever stored. Your session is identified only by
          a random ID. Chat messages are never saved — only anonymous flags (like "a crisis
          keyword was detected") are kept, and those are deleted after 24 hours.
        </p>
        <button
          onClick={onAccept}
          className="w-full rounded-full bg-ink text-sand font-semibold py-3 hover:bg-dusk active:scale-[0.99] transition-all"
        >
          {t(lang, "disclaimerAccept")}
        </button>
      </div>
    </div>
  );
}
