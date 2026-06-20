import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

// Helvetica Neue is a system font (not on Google Fonts). We use a system stack
// with Helvetica Neue first, falling back to system sans-serif.
const helvetica = {
  variable: "--font-sans",
  // next/font requires a google/local font; we use a CSS variable approach instead.
  // We'll set the font-family directly in globals via the body class.
};

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MathArena — Ton cerveau est ton arme.",
  description:
    "MathArena : la plateforme compétitive de duel 1v1 de calcul mental. Elo, divisions, pur skill. Affronte d'autres joueurs ou entraîne-toi.",
  keywords: [
    "MathArena",
    "calcul mental",
    "jeu compétitif",
    "1v1",
    "duel mathématique",
    "Elo",
    "brain game",
  ],
  authors: [{ name: "MathArena" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "MathArena — Ton cerveau est ton arme.",
    description: "Plateforme compétitive de duel 1v1 de calcul mental.",
    siteName: "MathArena",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MathArena",
    description: "Ton cerveau est ton arme. Duel 1v1 de calcul mental.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5efe6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${jetbrains.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" theme="light" />
      </body>
    </html>
  );
}
