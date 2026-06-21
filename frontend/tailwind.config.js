/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        aurora: {
          bg: "#050816",
          surface: "#0B1120",
          "surface-hover": "#111827",
          border: "rgba(255, 255, 255, 0.05)",
          "border-hover": "rgba(255, 255, 255, 0.1)",
          text: "#E2E8F0",
          muted: "#94A3B8",
        },
        module: {
          crm: "#9333EA",      // Electric Purple
          erp: "#10B981",      // Emerald Green
          analytics: "#06B6D4", // Neon Cyan
          referrals: "#F59E0B", // Soft Gold
          superadmin: "#E11D48", // Crimson/Purple
        },
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        sidebar: {
          DEFAULT: "#050816",
          hover: "rgba(255, 255, 255, 0.05)",
          active: "rgba(255, 255, 255, 0.1)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
        elevated: "0 20px 40px -20px rgba(0, 0, 0, 0.6)",
        "glow-crm": "0 0 20px rgba(147, 51, 234, 0.3)",
        "glow-erp": "0 0 20px rgba(16, 185, 129, 0.3)",
        "glow-analytics": "0 0 20px rgba(6, 182, 212, 0.3)",
        "glow-referrals": "0 0 20px rgba(245, 158, 11, 0.3)",
        "glow-super": "0 0 20px rgba(225, 29, 72, 0.3)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'aurora-base': 'radial-gradient(circle at 50% 0%, rgba(147, 51, 234, 0.05), transparent 50%), radial-gradient(circle at 100% 50%, rgba(6, 182, 212, 0.03), transparent 50%)',
      }
    },
  },
  plugins: [],
};
