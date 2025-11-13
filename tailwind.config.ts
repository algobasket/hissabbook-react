import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2357FF",
        secondary: "#0F172A",
        dark: "#0F172A",
        muted: "#64748B",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        card: "0 25px 60px rgba(15, 23, 42, 0.09)",
        subtle: "0 15px 30px rgba(35, 87, 255, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;


