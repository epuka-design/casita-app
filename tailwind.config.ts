import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Paleta Casita — cozy artesanal, cálida y unisex
        blanco: "#fffdf7", // blanco cálido (tarjetas)
        crema: "#f4efe3", // hueso, fondo principal
        terracota: {
          DEFAULT: "#c5532b",
          soft: "#dd8b53",
          ink: "#9a3f1f",
        },
        verde: {
          DEFAULT: "#7e9457", // salvia / oliva
          soft: "#a3b07e",
        },
        mostaza: {
          DEFAULT: "#d8a24a",
          soft: "#e7c082",
        },
        lavanda: {
          DEFAULT: "#9da7d0",
          soft: "#c2c8e4",
        },
        burdeos: "#5e1a1a",
        tinta: "#3a2e28", // marrón oscuro cálido (texto)
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        logo: ["var(--font-fredoka)", "var(--font-dm-sans)", "sans-serif"],
      },
      boxShadow: {
        suave: "0 1px 3px rgba(58,46,40,0.06), 0 1px 2px rgba(58,46,40,0.04)",
        carta: "0 6px 28px rgba(58,46,40,0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
