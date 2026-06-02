import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans, Fredoka } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Fuente redondeada y friendly sólo para el logotipo.
const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-fredoka",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Casita",
  description: "Gestión del hogar, simple y a mano.",
};

export const viewport: Viewport = {
  themeColor: "#f4efe3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      // esES tipa más estricto que el prop `localization`; el runtime es ok.
      localization={esES as unknown as Record<string, unknown>}
      appearance={{
        variables: {
          colorPrimary: "#c5532b",
          colorText: "#3a2e28",
          colorBackground: "#fffdf7",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-dm-sans)",
        },
      }}
    >
      <html
        lang="es"
        className={`${fraunces.variable} ${dmSans.variable} ${fredoka.variable}`}
      >
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
