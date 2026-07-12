import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { apiFetch, logout, getRole } from "../api.js";

const PIE_COLORS = ["#12253f", "#1f3a5f", "#8a6d1f", "#2f6b3a", "#8a1f1f"];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      apiFetch("/admin/dashboard/summary"),
      apiFetch("/admin/dashboard/timeseries"),
    ])
      .then(([s, t]) => {
        setSummary(s);
        setSeries(t);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <TopBar />

      {error && <div className="rounded-lg bg-risk-red-bg text-risk-red text-sm px-3 py-2 mb-4">{error}</div>}

      {!summary ? (
        <p className="text-sm text-ink/60">Loading dashboard…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Chats today" value={summary.chatsToday} />
            <KpiCard label="Chats this week" value={summary.chatsWeek} />
            <KpiCard label="Chats this month" value={summary.chatsMonth} />
            <KpiCard
              label="Crisis alerts"
              value={summary.crisisTotal}
              sub={`${summary.crisisPct}% of all chats`}
              tone="risk-red"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <KpiCard
              label="Get Help Now clicks / referral rate"
              value={summary.referralClicks}
              sub={`${summary.referralRatePct}% referral rate`}
            />
            <KpiCard
              label="Quiz completions"
              value={summary.quizStats.reduce((sum, q) => sum + q.attempts, 0)}
              sub={
                summary.quizStats.length
                  ? `Avg score ${(summary.quizStats.reduce((s, q) => s + q.avg_pct, 0) / summary.quizStats.length * 100).toFixed(0)}%`
                  : "No attempts yet"
              }
            />
          </div>

          <ChartCard title="Chats &amp; crisis alerts — last 14 days">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7ddcd" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total chats" stroke="#1f3a5f" strokeWidth={2} />
                <Line type="monotone" dataKey="crisis" name="Crisis alerts" stroke="#8a1f1f" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ChartCard title="Top 5 substances detected">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={summary.topDrugs} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7ddcd" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="drug" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="n" name="Mentions" fill="#1f3a5f" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Language split">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={summary.langSplit}
                    dataKey="n"
                    nameKey="language"
                    outerRadius={80}
                    label={(d) => d.language}
                  >
                    {summary.langSplit.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="Quiz completion rate &amp; average score">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink/50 text-xs uppercase tracking-wide">
                  <th className="py-2">Module</th>
                  <th className="py-2">Attempts</th>
                  <th className="py-2">Avg score</th>
                </tr>
              </thead>
              <tbody>
                {summary.quizStats.map((q) => (
                  <tr key={q.module_id} className="border-t border-clay">
                    <td className="py-2">{q.module_id}</td>
                    <td className="py-2">{q.attempts}</td>
                    <td className="py-2">{(q.avg_pct * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ChartCard>

          <a
            href={`${import.meta.env.VITE_SERVER_URL || "http://localhost:4000"}/api/admin/export.csv`}
            className="inline-block rounded-full bg-ink text-sand px-5 py-2.5 text-sm font-medium hover:bg-dusk"
          >
            Export CSV (aggregate only — no chat text, no IP)
          </a>
        </div>
      )}
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
        <p className="text-xs text-ink/50">Signed in as {getRole() || "admin"}</p>
      </div>
      <button onClick={logout} className="text-sm text-ink/60 hover:text-ink underline">
        Sign out
      </button>
    </div>
  );
}

function KpiCard({ label, value, sub, tone }) {
  return (
    <div className="rounded-2xl bg-white border border-clay p-4">
      <p className="text-xs text-ink/50 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${tone === "risk-red" ? "text-risk-red" : "text-ink"}`}>{value}</p>
      {sub && <p className="text-xs text-ink/50 mt-1">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl bg-white border border-clay p-4">
      <h2 className="text-sm font-semibold text-ink mb-3">{title}</h2>
      {children}
    </div>
  );
}
