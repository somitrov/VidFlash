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
        poppins: ["var(--font-poppins)", "Poppins", "sans-serif"],
        heading: ["var(--font-poppins)", "Poppins", "sans-serif"],
        openSans: ["var(--font-open-sans)", "Open Sans", "sans-serif"],
        sans: ["var(--font-open-sans)", "Open Sans", "system-ui", "sans-serif"],
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


