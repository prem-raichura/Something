import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        paper: "#F6F7F9",
        surface: "#FFFFFF",
        line: "#E6E8EE",
        ink: {
          950: "#0B1020",
          900: "#141A2A",
          800: "#1E2537",
          700: "#2C3446",
          500: "#5B6474",
          400: "#828B9C",
          300: "#AEB5C2",
        },
        teal: {
          soft: "#E4F5F4",
          DEFAULT: "#0FA3A3",
          600: "#0B8A8A",
        },
        coral: {
          soft: "#FCEBE6",
          DEFAULT: "#F0563B",
          600: "#D8452C",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,26,42,0.04), 0 1px 12px rgba(20,26,42,0.04)",
        pop: "0 8px 30px rgba(20,26,42,0.12)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(15,163,163,0.45)" },
          "70%": { boxShadow: "0 0 0 6px rgba(15,163,163,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(15,163,163,0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        "fade-up": "fade-up 0.35s ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
