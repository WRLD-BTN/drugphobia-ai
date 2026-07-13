const rawBase = import.meta.env.VITE_SERVER_URL || "";

export function getApiBase() {
  return rawBase.replace(/\/$/, "");
}

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBase();
  return base ? `${base}${normalizedPath}` : normalizedPath;
}

export function getSocketUrl() {
  return getApiBase() || undefined;
}
