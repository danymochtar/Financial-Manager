import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe5ff",
          200: "#bccdff",
          300: "#92abff",
          400: "#647fff",
          500: "#3f57ff",
          600: "#2c37f5",
          700: "#2529d8",
          800: "#2126af",
          900: "#1f2589",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Inter"],
      },
    },
  },
  plugins: [],
};

export default config;
