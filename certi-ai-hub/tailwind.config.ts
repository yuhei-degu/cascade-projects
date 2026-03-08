import type { Config } from "tailwindcss"
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#6366f1", dark: "#4f46e5" },
        sc:  { DEFAULT: "#0ea5e9", light: "#e0f2fe" },
        aws: { DEFAULT: "#f97316", light: "#fff7ed" },
      },
    },
  },
  plugins: [],
}
export default config
