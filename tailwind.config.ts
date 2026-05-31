import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Casita
        blanco: "#ffffff",
        crema: "#faf8f5", // off-white, fondo principal
        terracota: {
          DEFAULT: "#c8602a",
          soft: "#d97c4a",
          ink: "#a64d20",
        },
        verde: {
          DEFAULT: "#6b9e7a",
          soft: "#8bb89a",
        },
        tinta: "#1a1a1a", // casi negro
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        suave: "0 1px 3px rgba(26,26,26,0.06), 0 1px 2px rgba(26,26,26,0.04)",
        carta: "0 4px 24px rgba(26,26,26,0.06)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
