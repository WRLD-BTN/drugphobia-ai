import { useEffect, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { MessageCircle, ListChecks, LifeBuoy } from "lucide-react";
import Disclaimer from "./components/Disclaimer.jsx";
import LanguageToggle from "./components/LanguageToggle.jsx";
import ThemeToggle, { useTheme } from "./components/ThemeToggle.jsx";
import Home from "./pages/Home.jsx";
import Quiz from "./pages/Quiz.jsx";
import Resources from "./pages/Resources.jsx";
import { t } from "./i18n/strings.js";

const SESSION_KEY = "drugphobia_session_hash"; // sessionStorage only — cleared when the tab closes, never sent anywhere but our own API
const DISCLAIMER_KEY = "drugphobia_disclaimer_accepted";

function getOrCreateSessionHash() {
  let hash = sessionStorage.getItem(SESSION_KEY);
  if (!hash) {
    hash = "User#" + Math.floor(1000 + Math.random() * 9000) + "-" + Math.random().toString(16).slice(2, 10);
    sessionStorage.setItem(SESSION_KEY, hash);
  }
  return hash;
}

export default function App() {
  const [lang, setLang] = useState(localStorage.getItem("drugphobia_lang") || "en");
  const [theme, setTheme] = useTheme();
  const [accepted, setAccepted] = useState(() => sessionStorage.getItem(DISCLAIMER_KEY) === "1");
  const [sessionHash] = useState(getOrCreateSessionHash);
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("drugphobia_lang", lang);
  }, [lang]);

  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto bg-sand text-ink safe-t">
      {!accepted && (
        <Disclaimer
          lang={lang}
          onAccept={() => {
            sessionStorage.setItem(DISCLAIMER_KEY, "1");
            setAccepted(true);
          }}
        />
      )}

      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-surface/80 backdrop-blur">
        <div className="flex items-center gap-2.5 min-w-0">
          <BrandMark />
          <div className="min-w-0">
            <p className="font-bold text-ink leading-none truncate">{t(lang, "appName")}</p>
            <p className="text-[11px] text-ink/55 mt-1 truncate">{t(lang, "tagline")}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <ThemeToggle theme={theme} onChange={setTheme} />
          <LanguageToggle lang={lang} onChange={setLang} />
        </div>
      </header>

      <main className="flex-1 min-h-0">
        <Routes>
          <Route path="/" element={<Home lang={lang} sessionHash={sessionHash} />} />
          <Route path="/quiz" element={<Quiz lang={lang} sessionHash={sessionHash} />} />
          <Route path="/resources" element={<Resources lang={lang} />} />
        </Routes>
      </main>

      <nav className="flex border-t border-border bg-surface safe-b">
        <NavLink to="/" active={location.pathname === "/"} label={t(lang, "navHome")} Icon={MessageCircle} />
        <NavLink to="/quiz" active={location.pathname === "/quiz"} label={t(lang, "navQuiz")} Icon={ListChecks} />
        <NavLink
          to="/resources"
          active={location.pathname === "/resources"}
          label={t(lang, "getHelpNow")}
          Icon={LifeBuoy}
          emphasize
        />
      </nav>
    </div>
  );
}

function BrandMark() {
  return (
    <div
      aria-hidden="true"
      className="w-8 h-8 rounded-xl bg-brand-2/15 flex items-center justify-center shrink-0"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2l7 3v6c0 5-3 8.5-7 11-4-2.5-7-6-7-11V5z"
          className="fill-brand-2"
        />
        <path
          d="M8.5 12l2.3 2.3L15.5 9.5"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function NavLink({ to, active, label, Icon, emphasize }) {
  return (
    <Link
      to={to}
      className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
        emphasize ? "text-risk-red" : active ? "text-ink" : "text-ink/40"
      }`}
    >
      {active && !emphasize && (
        <span className="absolute top-1 w-8 h-1 rounded-full bg-brand-2" aria-hidden="true" />
      )}
      <Icon size={19} strokeWidth={active || emphasize ? 2.4 : 2} />
      {label}
    </Link>
  );
}
