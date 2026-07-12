import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const THEME_KEY = "drugphobia_theme";

/** Reads saved theme, falling back to the OS-level preference. */
export function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0c1016" : "#12253f");
}

export default function ThemeToggle({ theme, onChange }) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => onChange(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-clay/60 text-ink hover:bg-clay transition-colors"
    >
      {isDark ? <Sun size={17} strokeWidth={2.25} /> : <Moon size={17} strokeWidth={2.25} />}
    </button>
  );
}

/** Small hook so any component can read/set the shared theme without prop drilling further than App. */
export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return [theme, setTheme];
}
