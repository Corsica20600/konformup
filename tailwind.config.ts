import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f4efe6",
        ink: "#1d2a24",
        pine: "#285943",
        sand: "#e5dccb",
        accent: "#d9734e"
      },
      boxShadow: {
        panel: "0 12px 32px rgba(29, 42, 36, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
