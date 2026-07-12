import { useEffect, useState } from "react";
import { Search, Phone, MessageCircle } from "lucide-react";
import { t } from "../i18n/strings.js";
import { ResourcesMapIllustration } from "./Illustrations.jsx";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export default function ResourceList({ lang }) {
  const [data, setData] = useState(null);
  const [area, setArea] = useState("");

  useEffect(() => {
    const url = area
      ? `${SERVER_URL}/api/resources/nearest?area=${encodeURIComponent(area)}`
      : `${SERVER_URL}/api/resources`;
    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [area]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="rounded-b-xl3 bg-gradient-to-br from-dusk to-ink text-sand px-4 pt-4 pb-6 relative overflow-hidden">
        <span aria-hidden="true" className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <h2 className="text-lg font-bold relative">{t(lang, "navResources")}</h2>
        <p className="text-xs text-sand/70 mt-1 relative">{t(lang, "verifyNotice")}</p>
        <div className="mt-3 relative">
          <ResourcesMapIllustration className="w-20 absolute right-0 -top-2 opacity-90" />
        </div>
      </div>

      <div className="p-4 space-y-5">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Type your area (e.g. Harare, Bulawayo)…"
            className="w-full rounded-full bg-surface2 border border-border pl-10 pr-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-2 placeholder:text-ink/40"
          />
        </div>

        {!data ? (
          <p className="text-sm text-ink/60">Loading…</p>
        ) : (
          <>
            <section>
              <h3 className="text-sm font-bold text-dusk mb-2">{t(lang, "resourcesHelplines")}</h3>
              <div className="space-y-2">
                {data.helplines.map((h) => (
                  <ResourceCard key={h.id} item={h} />
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-dusk mb-2">{t(lang, "resourcesFacilities")}</h3>
              <div className="space-y-2">
                {data.facilities.map((f) => (
                  <ResourceCard key={f.id} item={f} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function ResourceCard({ item }) {
  const unverified = item.verified === false;
  return (
    <div className="rounded-xl card bg-surface p-3.5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-sm">{item.name}</p>
        {unverified && (
          <span className="text-[10px] uppercase tracking-wide font-bold text-risk-yellow bg-risk-yellow-bg px-2 py-0.5 rounded-full shrink-0">
            Unverified
          </span>
        )}
      </div>
      {item.area && <p className="text-xs text-ink/55 mt-0.5">{item.area}</p>}
      <div className="flex items-center gap-4 mt-2">
        {item.phone && item.phone.match(/^[\d+ ]+$/) ? (
          <a
            href={`tel:${item.phone.replace(/\s+/g, "")}`}
            className="flex items-center gap-1.5 text-sm text-brand-2 font-semibold"
          >
            <Phone size={14} /> {item.phone}
          </a>
        ) : (
          item.phone && <span className="text-sm text-ink/70">{item.phone}</span>
        )}
        {item.whatsapp && (
          <a
            href={`https://wa.me/${item.whatsapp.replace(/\D/g, "")}`}
            className="flex items-center gap-1.5 text-xs text-brand-2 font-medium"
          >
            <MessageCircle size={13} /> WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
