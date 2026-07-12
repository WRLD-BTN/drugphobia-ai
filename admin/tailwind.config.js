/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12253f",
        dusk: "#1f3a5f",
        sand: "#f6f4ee",
        clay: "#e7ddcd",
        "risk-green": "#2f6b3a",
        "risk-green-bg": "#eaf3ea",
        "risk-yellow": "#8a6d1f",
        "risk-yellow-bg": "#fbf3da",
        "risk-red": "#8a1f1f",
        "risk-red-bg": "#fbeaea",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
