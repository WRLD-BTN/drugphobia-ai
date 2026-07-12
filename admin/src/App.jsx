import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { isLoggedIn } from "./api.js";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Moderation from "./pages/Moderation.jsx";
import ResourceManager from "./pages/ResourceManager.jsx";

function RequireAuth({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  const showSidebar = isLoggedIn() && location.pathname !== "/login";

  return (
    <div className="min-h-screen flex">
      {showSidebar && <Sidebar />}
      <div className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/moderation" element={<RequireAuth><Moderation /></RequireAuth>} />
          <Route path="/resources" element={<RequireAuth><ResourceManager /></RequireAuth>} />
        </Routes>
      </div>
    </div>
  );
}

function Sidebar() {
  const location = useLocation();
  const linkClass = (path) =>
    `block px-4 py-2.5 rounded-lg text-sm font-medium ${
      location.pathname === path ? "bg-ink text-sand" : "text-ink/70 hover:bg-clay/50"
    }`;

  return (
    <aside className="w-56 border-r border-clay bg-white p-4 hidden sm:block">
      <p className="font-semibold text-ink mb-1">DrugPhobia AI</p>
      <p className="text-[11px] text-ink/40 mb-6">Admin</p>
      <nav className="space-y-1">
        <Link to="/" className={linkClass("/")}>Dashboard</Link>
        <Link to="/moderation" className={linkClass("/moderation")}>Moderation</Link>
        <Link to="/resources" className={linkClass("/resources")}>Resource Manager</Link>
      </nav>
    </aside>
  );
}
