import { useEffect, useState } from "react";
import { ChevronRight, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { t } from "../i18n/strings.js";
import { apiUrl } from "../api.js";
import quizBankData from "../../../shared/quiz_bank.json";
import { QuizAwardIllustration } from "./Illustrations.jsx";

export default function QuizModule({ lang, sessionHash }) {
  const [bank, setBank] = useState(quizBankData);
  const [moduleIdx, setModuleIdx] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch(apiUrl("/api/quiz"))
      .then((r) => r.json())
      .then((data) => {
        if (active && data?.modules?.length) {
          setBank(data);
          setStatusMessage("");
        }
      })
      .catch(() => {
        if (active) setStatusMessage(t(lang, "quizOffline"));
      });
    return () => {
      active = false;
    };
  }, [lang]);

  const startModule = (index) => {
    setModuleIdx(index);
    setQIdx(0);
    setScore(0);
    setDone(false);
    setSelected(null);
    setStatusMessage("");
  };

  if (!bank?.modules?.length) {
    return <p className="p-4 text-sm text-ink/60">{statusMessage || t(lang, "quizLoading")}</p>;
  }

  if (moduleIdx === null) {
    return (
      <div className="p-4 space-y-3 h-full overflow-y-auto">
        <h2 className="text-lg font-bold">{t(lang, "navQuiz")}</h2>
        <p className="text-sm text-ink/60">{t(lang, "quizChooseModule")}</p>
        {bank.modules.map((m, i) => {
          const moduleTitle = lang === "sn" ? m.title_sn || m.title_en : m.title_en || m.title_sn;
          const moduleSummary = lang === "sn" ? m.summary_sn || m.summary_en : m.summary_en || m.summary_sn;
          return (
            <button
              key={m.id}
              onClick={() => startModule(i)}
              className="w-full text-left rounded-2xl card bg-surface hover:border-brand-2/40 p-4 transition-colors flex items-center gap-3 shadow-card"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-2/15 text-brand-2 flex items-center justify-center font-bold text-sm shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{moduleTitle}</p>
                <p className="text-xs text-ink/55 mt-0.5">{moduleSummary}</p>
                <p className="text-[11px] text-brand-2 mt-1">{m.questions.length} {t(lang, "quizQuestions")}</p>
              </div>
              <ChevronRight size={18} className="text-ink/30 shrink-0" />
            </button>
          );
        })}
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
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => startModule(moduleIdx)}
            className="rounded-full bg-ink text-sand px-6 py-2.5 text-sm font-semibold active:scale-95 transition-transform flex items-center gap-2"
          >
            <RotateCcw size={16} />
            {t(lang, "quizRetake")}
          </button>
          <button
            onClick={() => setModuleIdx(null)}
            className="rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-semibold active:scale-95 transition-transform"
          >
            {t(lang, "quizAnother")}
          </button>
        </div>
      </div>
    );
  }

  const questionText = lang === "sn" ? question.q_sn || question.q_en : question.q_en || question.q_sn;
  const noteText = lang === "sn" ? question.note_sn || question.note_en : question.note_en || question.note_sn;
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
          {noteText && <p className="text-xs text-ink/60 mb-3 leading-relaxed">{noteText}</p>}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setModuleIdx(null)}
              className="rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold active:scale-95 transition-transform"
            >
              {t(lang, "quizBack")}
            </button>
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
              {qIdx + 1 < module.questions.length ? t(lang, "quizNext") : t(lang, "quizSeeScore")}
            </button>
          </div>
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
  fetch(apiUrl("/api/quiz/submit"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionHash, moduleId, score, total }),
  }).catch(() => {});
}
