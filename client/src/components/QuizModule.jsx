import { useEffect, useState } from "react";
import { ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { t } from "../i18n/strings.js";
import { QuizAwardIllustration } from "./Illustrations.jsx";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export default function QuizModule({ lang, sessionHash }) {
  const [bank, setBank] = useState(null);
  const [moduleIdx, setModuleIdx] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/quiz`)
      .then((r) => r.json())
      .then(setBank)
      .catch(() => setBank(null));
  }, []);

  if (!bank) {
    return <p className="p-4 text-sm text-ink/60">Loading quiz…</p>;
  }

  if (moduleIdx === null) {
    return (
      <div className="p-4 space-y-3 h-full overflow-y-auto">
        <h2 className="text-lg font-bold">{t(lang, "navQuiz")}</h2>
        {bank.modules.map((m, i) => (
          <button
            key={m.id}
            onClick={() => {
              setModuleIdx(i);
              setQIdx(0);
              setScore(0);
              setDone(false);
              setSelected(null);
            }}
            className="w-full text-left rounded-xl2 card bg-surface hover:border-brand-2/40 p-4 transition-colors flex items-center gap-3 shadow-card"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-2/15 text-brand-2 flex items-center justify-center font-bold text-sm shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{lang === "sn" ? m.title_sn : m.title_en}</p>
              <p className="text-xs text-ink/55 mt-0.5">{m.questions.length} questions</p>
            </div>
            <ChevronRight size={18} className="text-ink/30 shrink-0" />
          </button>
        ))}
      </div>
    );
  }

  const module = bank.modules[moduleIdx];
  const question = module.questions[qIdx];

  if (done) {
    const total = module.questions.length;
    submitScore(sessionHash, module.id, score, total);
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full">
        <QuizAwardIllustration className="w-32 mb-4" />
        <p className="text-sm text-ink/55 mb-1">{t(lang, "quizScore")}</p>
        <p className="text-4xl font-extrabold text-ink mb-6">
          {score} / {total}
        </p>
        <button
          onClick={() => setModuleIdx(null)}
          className="rounded-full bg-ink text-sand px-6 py-2.5 text-sm font-semibold active:scale-95 transition-transform"
        >
          {t(lang, "quizRetake")}
        </button>
      </div>
    );
  }

  const questionText = lang === "sn" ? question.q_sn || question.q_en : question.q_en;
  const progress = ((qIdx + (selected !== null ? 1 : 0)) / module.questions.length) * 100;

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="h-1.5 rounded-full bg-surface2 mb-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-2 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-ink/50 mb-2 font-medium">
        {qIdx + 1} / {module.questions.length}
      </p>
      <p className="font-semibold mb-4 text-[15px] leading-snug">{questionText}</p>
      <div className="space-y-2">
        {question.options.map((opt) => {
          const isSelected = selected === opt;
          const isCorrect = opt === question.answer;
          const showResult = selected !== null;
          return (
            <button
              key={opt}
              disabled={selected !== null}
              onClick={() => setSelected(opt)}
              className={`w-full text-left rounded-xl border p-3 text-sm transition-colors flex items-center justify-between gap-2 ${
                showResult && isCorrect
                  ? "border-risk-green bg-risk-green-bg"
                  : showResult && isSelected
                  ? "border-risk-red bg-risk-red-bg"
                  : "border-border bg-surface hover:bg-surface2"
              }`}
            >
              <span>{opt}</span>
              {showResult && isCorrect && <CheckCircle2 size={17} className="text-risk-green shrink-0" />}
              {showResult && isSelected && !isCorrect && <XCircle size={17} className="text-risk-red shrink-0" />}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="mt-4">
          {question.note_en && <p className="text-xs text-ink/60 mb-3 leading-relaxed">{question.note_en}</p>}
          <button
            onClick={() => {
              if (selected === question.answer) setScore((s) => s + 1);
              if (qIdx + 1 < module.questions.length) {
                setQIdx((i) => i + 1);
                setSelected(null);
              } else {
                setDone(true);
              }
            }}
            className="rounded-full bg-ink text-sand px-6 py-2.5 text-sm font-semibold active:scale-95 transition-transform"
          >
            {qIdx + 1 < module.questions.length ? "Next" : "See score"}
          </button>
        </div>
      )}
    </div>
  );
}

let alreadySubmitted = new Set();
function submitScore(sessionHash, moduleId, score, total) {
  const key = `${sessionHash}:${moduleId}`;
  if (alreadySubmitted.has(key)) return;
  alreadySubmitted.add(key);
  fetch(`${SERVER_URL}/api/quiz/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionHash, moduleId, score, total }),
  }).catch(() => {});
}
