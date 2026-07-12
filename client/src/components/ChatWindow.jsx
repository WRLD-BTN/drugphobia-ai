import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { SendHorizontal, WifiOff } from "lucide-react";
import { classifyLocal, detectAgeFlagLocal } from "../classifier/triageClient.js";
import { t } from "../i18n/strings.js";
import CrisisCard from "./CrisisCard.jsx";
import AgeBanner from "./AgeBanner.jsx";
import { ChatGreetingIllustration } from "./Illustrations.jsx";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export default function ChatWindow({ lang, sessionHash }) {
  const [messages, setMessages] = useState([
    { from: "bot", text: greetingFor(lang), tier: "GREEN" },
  ]);
  const [input, setInput] = useState("");
  const [crisis, setCrisis] = useState(null);
  const [ageFlag, setAgeFlag] = useState(false);
  const [connected, setConnected] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const socketRef = useRef(null);
  const sessionHashRef = useRef(sessionHash || null);
  const listEndRef = useRef(null);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    const socket = io(SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      auth: { sessionHash: sessionHashRef.current },
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("session", ({ sessionHash }) => (sessionHashRef.current = sessionHash));

    socket.on("crisis", (payload) => setCrisis(payload));

    socket.on("reply", (payload) => {
      if (payload.ageFlag) setAgeFlag(true);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: payload.text, tier: payload.tier, actions: payload.actions },
      ]);
    });

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, crisis]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    // Instant local-first triage for immediate UI feedback, especially
    // important when offline. The server re-checks the same message as the
    // authoritative gate the moment it arrives (see index.js).
    const localGate = classifyLocal(text);
    const localAge = detectAgeFlagLocal(text);
    if (localAge) setAgeFlag(true);

    setMessages((prev) => [...prev, { from: "user", text }]);

    if (localGate.tier === "RED") {
      // Show the crisis card immediately from the local classifier — don't
      // wait on a round-trip if the connection is slow or offline. The
      // socket 'crisis' event (if it arrives) will just confirm the same UI.
      setCrisis({
        heading: t(lang, "crisisHeading"),
        actions: [
          { label: "Childline 116", type: "call", value: "116" },
          { label: "Childline WhatsApp", type: "whatsapp", value: "+263719116116" },
          { label: "NDA Helpline (verify)", type: "call", value: "0808 20 20" },
        ],
      });
    }

    if (connected && socketRef.current) {
      socketRef.current.emit("message", { text, lang });
    } else {
      // Fully offline fallback: at minimum, the local classifier still
      // caught RED/YELLOW/GREEN, so the person isn't left with silence.
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          tier: localGate.tier,
          text:
            localGate.tier === "GREEN"
              ? offlineGreenReply(lang)
              : "",
        },
      ]);
    }
  }, [input, connected, lang]);

  const handleReferralClick = () => {
    if (sessionHashRef.current) {
      fetch(`${SERVER_URL}/api/chat/referral-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionHash: sessionHashRef.current }),
      }).catch(() => {});
    }
  };

  if (crisis) {
    return (
      <CrisisCard
        lang={lang}
        actions={crisis.actions}
        onReferralClick={handleReferralClick}
        onSafeNow={() => setCrisis(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {offline && (
        <div className="flex items-center justify-center gap-1.5 bg-clay/70 text-ink/70 text-xs text-center py-1.5">
          <WifiOff size={13} />
          {lang === "sn"
            ? "Hapana network — grounding nezvimwe zvinoshanda"
            : lang === "nd"
            ? "Alukho uxhumo — okusebenza ngaphandle kwenethiwekhi kusasebenza"
            : "No connection — offline tools still work"}
        </div>
      )}
      {ageFlag && <AgeBanner lang={lang} onDismiss={() => setAgeFlag(false)} />}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 1 && (
          <div className="flex flex-col items-center text-center px-4 pt-2 pb-4 animate-fade-up">
            <ChatGreetingIllustration className="w-36 h-auto mb-2 opacity-90" />
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} lang={lang} />
        ))}
        <div ref={listEndRef} />
      </div>

      <div className="p-3 border-t border-border flex gap-2 bg-surface safe-b">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={t(lang, "chatPlaceholder")}
          className="flex-1 rounded-full bg-surface2 border border-border px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-2 placeholder:text-ink/40"
          aria-label={t(lang, "chatPlaceholder")}
        />
        <button
          onClick={handleSend}
          aria-label={t(lang, "send")}
          className="rounded-full bg-ink text-sand w-11 h-11 shrink-0 flex items-center justify-center hover:bg-dusk active:scale-95 transition-transform"
        >
          <SendHorizontal size={18} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message, lang }) {
  const isUser = message.from === "user";
  const tierBg =
    message.tier === "YELLOW"
      ? "bg-risk-yellow-bg border border-risk-yellow/25 text-ink"
      : "card text-ink";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-card ${
          isUser ? "bg-ink text-sand rounded-br-md" : `${tierBg} rounded-bl-md`
        }`}
      >
        {message.text}
        {message.actions?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.actions.map((a) => (
              <a
                key={a.label}
                href={a.type === "call" ? `tel:${a.value?.replace(/\s+/g, "")}` : "#"}
                className="text-xs font-semibold underline text-brand-2"
              >
                {a.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function greetingFor(lang) {
  return t(lang, "tagline");
}

function offlineGreenReply(lang) {
  const map = {
    en: "You're offline right now, but the grounding exercises and quiz still work. I'll answer general questions again once you're back online.",
    sn: "Iwe hausi online izvozvi, asi maekisesaizi nebvunzo zvichiri kushanda. Ndichapindura mibvunzo mune rimwe nguva kana wava online.",
    nd: "Awuxhunyiwe manje, kodwa imisebenzi yokuzola nombuzo kusasebenza. Ngizophendula imibuzo lapho usuxhunyiwe futhi.",
  };
  return map[lang] || map.en;
}
