// api.js
//
// Thin fetch wrapper for the admin API. Token is kept in sessionStorage
// (cleared when the tab closes) rather than localStorage, and an idle timer
// forces logout after 15 minutes matching the JWT's own expiry
// (server/src/middleware/auth.js signs 15m tokens) — belt-and-braces so the
// UI state and the token expiry can never silently drift apart.

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";
const TOKEN_KEY = "drugphobia_admin_token";
const ROLE_KEY = "drugphobia_admin_role";
const IDLE_LIMIT_MS = 15 * 60 * 1000;

let idleTimer = null;

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getRole() {
  return sessionStorage.getItem(ROLE_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ROLE_KEY);
  clearTimeout(idleTimer);
  window.location.hash = "#/login";
}

export function armIdleLogout() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(logout, IDLE_LIMIT_MS);
}

export async function login(email, password) {
  const res = await fetch(`${SERVER_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Login failed");
  }
  const data = await res.json();
  sessionStorage.setItem(TOKEN_KEY, data.token);
  sessionStorage.setItem(ROLE_KEY, data.role);
  armIdleLogout();
  return data;
}

export async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${SERVER_URL}/api${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  armIdleLogout(); // any successful API activity resets the idle clock
  if (res.status === 401) {
    logout();
    throw new Error("Session expired — please log in again.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}
