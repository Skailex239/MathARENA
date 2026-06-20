import type { Metadata, Viewport } from "next";
import { Inter, Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MathArena — Your brain is your weapon",
  description:
    "MathArena : la plateforme compétitive de duel 1v1 de calcul mental. Classes, sorts, combos, ultimes, Elo. Affronte d'autres joueurs ou l'IA.",
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
    title: "MathArena — Your brain is your weapon",
    description:
      "Plateforme compétitive de duel 1v1 de calcul mental en temps réel.",
    siteName: "MathArena",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MathArena",
    description: "Your brain is your weapon. 1v1 mental math duel.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D1117",
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
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${syne.variable} ${jetbrains.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
