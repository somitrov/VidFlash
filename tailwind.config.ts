import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        ui: ["var(--font-ui)", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        sans: ["var(--font-ui)", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "'SF Mono'", "'Cascadia Code'", "'Segoe UI Mono'", "Consolas", "monospace"],
        heading: ["var(--font-ui)", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        poppins: ["var(--font-poppins)", "Poppins", "sans-serif"],
        openSans: ["var(--font-open-sans)", "Open Sans", "sans-serif"],
        stormGust: ["'Storm Gust'", "'StormGust'", "var(--font-poppins)", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;


