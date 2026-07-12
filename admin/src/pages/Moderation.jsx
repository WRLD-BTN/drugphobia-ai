import { useEffect, useState } from "react";
import { apiFetch } from "../api.js";

export default function Moderation() {
  const [flags, setFlags] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    apiFetch("/admin/moderation/flags")
      .then(setFlags)
      .catch((err) => setError(err.message));
  };

  useEffect(load, []);

  const resolve = async (id) => {
    try {
      await apiFetch(`/admin/moderation/flags/${id}/resolve`, { method: "POST" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold text-ink mb-1">Moderation Queue</h1>
      <p className="text-sm text-ink/60 mb-6">
        Flagged sessions only — never raw chat text. Escalate anything genuinely concerning to
        your NGO/NDA partner contact outside this system.
      </p>

      {error && <div className="rounded-lg bg-risk-red-bg text-risk-red text-sm px-3 py-2 mb-4">{error}</div>}

      {!flags ? (
        <p className="text-sm text-ink/60">Loading…</p>
      ) : flags.length === 0 ? (
        <p className="text-sm text-ink/50 italic">No open flags. 🎉</p>
      ) : (
        <div className="space-y-2">
          {flags.map((f) => (
            <div key={f.id} className="rounded-xl bg-white border border-clay p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{f.session_hash}</p>
                <p className="text-xs text-ink/50">{f.reason || "No reason recorded"} · {f.ts}</p>
              </div>
              <button
                onClick={() => resolve(f.id)}
                className="text-sm rounded-full bg-ink text-sand px-4 py-1.5 hover:bg-dusk"
              >
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
