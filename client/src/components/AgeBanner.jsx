import { HeartHandshake, X } from "lucide-react";
import { t } from "../i18n/strings.js";

export default function AgeBanner({ lang, onDismiss }) {
  return (
    <div className="mx-4 mb-3 rounded-xl bg-risk-yellow-bg border border-risk-yellow/25 p-3 text-sm text-ink/90 flex items-start gap-3 animate-fade-up">
      <HeartHandshake size={18} className="text-risk-yellow shrink-0 mt-0.5" strokeWidth={2.2} />
      <div className="flex-1">
        <p>{t(lang, "ageBanner")}</p>
        <a
          href="tel:116"
          className="inline-block mt-2 text-risk-yellow font-semibold underline"
        >
          {t(lang, "ageBannerCall")}
        </a>
      </div>
      <button onClick={onDismiss} aria-label="Dismiss" className="text-ink/40 hover:text-ink shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}
