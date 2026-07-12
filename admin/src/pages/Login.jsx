import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-clay p-6">
        <h1 className="text-xl font-semibold text-ink mb-1">DrugPhobia AI</h1>
        <p className="text-sm text-ink/60 mb-6">Admin &amp; moderation dashboard</p>

        {error && (
          <div className="mb-4 rounded-lg bg-risk-red-bg text-risk-red text-sm px-3 py-2">{error}</div>
        )}

        <label className="block text-xs font-medium text-ink/70 mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-clay px-3 py-2 text-sm mb-4 outline-none focus-visible:ring-2 focus-visible:ring-ink"
        />

        <label className="block text-xs font-medium text-ink/70 mb-1">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-clay px-3 py-2 text-sm mb-6 outline-none focus-visible:ring-2 focus-visible:ring-ink"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ink text-sand font-medium py-2.5 text-sm hover:bg-dusk disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-[11px] text-ink/40 mt-4 text-center">
          No account yet? Run <code className="bg-clay/50 px-1 rounded">node createAdmin.js</code> on the server.
        </p>
      </form>
    </div>
  );
}
