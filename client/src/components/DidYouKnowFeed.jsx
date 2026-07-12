import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import researchDb from "../../../shared/research_db.json";
import { t } from "../i18n/strings.js";
import { EmptyStateIllustration } from "./Illustrations.jsx";

export default function DidYouKnowFeed({ lang }) {
  const [idx, setIdx] = useState(0);
  const cards = researchDb.cards;

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % cards.length), 8000);
    return () => clearInterval(id);
  }, [cards.length]);

  if (!cards.length) {
    return (
      <div className="p-8 flex flex-col items-center text-center">
        <EmptyStateIllustration className="w-32 mb-3" />
        <p className="text-sm text-ink/60">Nothing to show yet.</p>
      </div>
    );
  }

  const card = cards[idx];
  const text = lang === "sn" ? card.text_sn || card.text_en : card.text_en;

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h2 className="text-lg font-bold mb-3">{t(lang, "navDidYouKnow")}</h2>

      <div className="relative rounded-xl3 bg-gradient-to-br from-dusk to-ink text-sand p-6 min-h-[160px] flex items-center shadow-soft overflow-hidden">
        <span
          aria-hidden="true"
          className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10"
        />
        <span
          aria-hidden="true"
          className="absolute -left-8 -bottom-10 w-32 h-32 rounded-full bg-white/5"
        />
        <p className="relative text-sm leading-relaxed font-medium">{text}</p>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setIdx((i) => (i - 1 + cards.length) % cards.length)}
          aria-label="Previous"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-surface2 hover:bg-clay text-ink transition-colors"
        >
          <ChevronLeft size={17} />
        </button>

        <div className="flex gap-1.5">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Card ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-6 bg-brand-2" : "w-1.5 bg-clay"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setIdx((i) => (i + 1) % cards.length)}
          aria-label="Next"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-surface2 hover:bg-clay text-ink transition-colors"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
