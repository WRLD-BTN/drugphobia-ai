import { useEffect, useState } from "react";
import { apiFetch } from "../api.js";

export default function ResourceManager() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch("/admin/resources").then(setData).catch((err) => setError(err.message));
  }, []);

  const updateHelpline = (idx, field, value) => {
    setData((d) => {
      const next = structuredClone(d);
      next.helplines[idx][field] = value;
      return next;
    });
  };

  const updateFacility = (idx, field, value) => {
    setData((d) => {
      const next = structuredClone(d);
      next.facilities[idx][field] = value;
      return next;
    });
  };

  const save = async () => {
    setError(null);
    setSaved(false);
    try {
      await apiFetch("/admin/resources", { method: "PUT", body: JSON.stringify(data) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!data) return <div className="p-6 text-sm text-ink/60">Loading…</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-ink">Resource Manager</h1>
        <button onClick={save} className="rounded-full bg-ink text-sand px-5 py-2 text-sm hover:bg-dusk">
          Save changes
        </button>
      </div>
      <p className="text-sm text-ink/60 mb-6">
        Update helplines and facility contact details here — changes go live immediately,
        no redeploy needed. Please verify any number before marking it as verified.
      </p>

      {saved && <div className="rounded-lg bg-risk-green-bg text-risk-green text-sm px-3 py-2 mb-4">Saved.</div>}
      {error && <div className="rounded-lg bg-risk-red-bg text-risk-red text-sm px-3 py-2 mb-4">{error}</div>}

      <h2 className="text-sm font-semibold text-dusk mb-2 mt-4">Helplines</h2>
      <div className="space-y-3 mb-6">
        {data.helplines.map((h, i) => (
          <EditableCard
            key={h.id}
            item={h}
            fields={["name", "phone", "whatsapp", "hours"]}
            onChange={(field, value) => updateHelpline(i, field, value)}
            onToggleVerified={(v) => updateHelpline(i, "verified", v)}
          />
        ))}
      </div>

      <h2 className="text-sm font-semibold text-dusk mb-2">Facilities</h2>
      <div className="space-y-3">
        {data.facilities.map((f, i) => (
          <EditableCard
            key={f.id}
            item={f}
            fields={["name", "area", "phone", "hours"]}
            onChange={(field, value) => updateFacility(i, field, value)}
            onToggleVerified={(v) => updateFacility(i, "verified", v)}
          />
        ))}
      </div>
    </div>
  );
}

function EditableCard({ item, fields, onChange, onToggleVerified }) {
  return (
    <div className="rounded-xl bg-white border border-clay p-4">
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <label key={field} className="block">
            <span className="text-[11px] uppercase tracking-wide text-ink/40">{field}</span>
            <input
              value={item[field] || ""}
              onChange={(e) => onChange(field, e.target.value)}
              className="w-full rounded-lg border border-clay px-2.5 py-1.5 text-sm mt-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ink"
            />
          </label>
        ))}
      </div>
      <label className="flex items-center gap-2 mt-3 text-xs">
        <input
          type="checkbox"
          checked={!!item.verified}
          onChange={(e) => onToggleVerified(e.target.checked)}
        />
        Verified against a real source
      </label>
    </div>
  );
}
