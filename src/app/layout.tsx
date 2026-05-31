import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Casita",
  description: "Gestión del hogar, simple y a mano.",
};

export const viewport: Viewport = {
  themeColor: "#faf8f5",
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
          colorPrimary: "#c8602a",
          colorText: "#1a1a1a",
          colorBackground: "#ffffff",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-dm-sans)",
        },
      }}
    >
      <html lang="es" className={`${cormorant.variable} ${dmSans.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
