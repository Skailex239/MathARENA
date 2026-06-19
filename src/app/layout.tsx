import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MathArena — Ton cerveau est ton arme",
  description:
    "MathArena : le jeu compétitif 1v1 de calcul mental en temps réel. Classes, sorts, combos, ultimes, mode classé Elo. Affronte d'autres joueurs ou l'IA.",
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
    title: "MathArena — Ton cerveau est ton arme",
    description:
      "Jeu compétitif 1v1 de calcul mental en temps réel. Classes, sorts, combos et ultimes.",
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
  themeColor: "#15101c",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
