/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Theme-aware surfaces/text — driven by CSS variables so light/dark
        // (and prefers-color-scheme) swap instantly with no re-render.
        // Kept as the same token names used across the original build
        // (ink/dusk/sand/clay) so existing className usage keeps working,
        // but they now resolve through CSS vars instead of fixed hexes.
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        dusk: "rgb(var(--c-dusk) / <alpha-value>)",
        sand: "rgb(var(--c-sand) / <alpha-value>)",
        clay: "rgb(var(--c-clay) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        surface2: "rgb(var(--c-surface-2) / <alpha-value>)",
        border: "rgb(var(--c-border) / <alpha-value>)",
        brand: "rgb(var(--c-brand) / <alpha-value>)",
        "brand-2": "rgb(var(--c-brand-2) / <alpha-value>)",
        // Strict triage colors — reserved ONLY for risk-state UI, per spec.
        // High-contrast in both themes (WCAG AA+ against their own bg).
        "risk-green": "rgb(var(--c-green) / <alpha-value>)",
        "risk-green-bg": "rgb(var(--c-green-bg) / <alpha-value>)",
        "risk-yellow": "rgb(var(--c-yellow) / <alpha-value>)",
        "risk-yellow-bg": "rgb(var(--c-yellow-bg) / <alpha-value>)",
        "risk-red": "rgb(var(--c-red) / <alpha-value>)",
        "risk-red-bg": "rgb(var(--c-red-bg) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -8px rgb(0 0 0 / 0.12)",
        card: "0 1px 3px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.08)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
