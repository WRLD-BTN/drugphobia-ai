import { useState } from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import ChatWindow from "../components/ChatWindow.jsx";
import DidYouKnowFeed from "../components/DidYouKnowFeed.jsx";
import { t } from "../i18n/strings.js";

export default function Home({ lang, sessionHash }) {
  const [tab, setTab] = useState("chat");

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3">
        <div className="flex gap-1 p-1 rounded-full bg-surface2/70 border border-border">
          <TabButton
            active={tab === "chat"}
            onClick={() => setTab("chat")}
            label={t(lang, "navHome")}
            Icon={MessageCircle}
          />
          <TabButton
            active={tab === "feed"}
            onClick={() => setTab("feed")}
            label={t(lang, "navDidYouKnow")}
            Icon={Sparkles}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 mt-1">
        {tab === "chat" ? <ChatWindow lang={lang} sessionHash={sessionHash} /> : <DidYouKnowFeed lang={lang} />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, Icon }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold transition-colors ${
        active ? "bg-surface text-ink shadow-card" : "text-ink/50 hover:text-ink/80"
      }`}
    >
      <Icon size={15} strokeWidth={2.3} />
      {label}
    </button>
  );
}
