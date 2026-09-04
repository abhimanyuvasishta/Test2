import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f7f1e8",
          100: "#efe4d2",
          200: "#e0c9a4",
          300: "#d4b484",
          400: "#c4a574",
          500: "#b08d58",
          600: "#9a7544",
          700: "#7c5c36",
          800: "#5c4428",
          900: "#3d2d1b",
        },
        surface: {
          900: "#0a0a0f",
          800: "#12121a",
          700: "#1a1a26",
          600: "#242433",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(196, 165, 116, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(196, 165, 116, 0.55)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
