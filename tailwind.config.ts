import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4DA6FF",
        "text-primary": "#000000",
        "text-secondary": "#4B5563",
        background: "#FFFFFF",
      },
      borderRadius: {
        base: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
