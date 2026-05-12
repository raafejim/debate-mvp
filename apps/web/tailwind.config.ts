import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d12",
        panel: "#151821",
        border: "#262a36",
        accent: "#7c5cff",
        accentMuted: "#4a3aaa",
        yes: "#22c55e",
        no: "#ef4444",
        skip: "#737583",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
