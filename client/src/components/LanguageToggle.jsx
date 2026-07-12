import { t } from "../i18n/strings.js";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "sn", label: "SN" },
  { code: "nd", label: "ND" },
];

export default function LanguageToggle({ lang, onChange }) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-clay/60" role="group" aria-label={t(lang, "languageLabel")}>
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          aria-pressed={lang === code}
          className={`px-2 py-1 rounded-full text-[11px] font-bold transition-colors ${
            lang === code ? "bg-ink text-sand" : "text-ink/60 hover:text-ink"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
