"use client";

import { useApp, type View } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Swords, Home, User, Trophy, BookOpen } from "lucide-react";

const LINKS: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: "home", label: "Accueil", icon: <Home className="w-4 h-4" /> },
  { view: "classselect", label: "Jouer", icon: <Swords className="w-4 h-4" /> },
  { view: "profile", label: "Profil", icon: <User className="w-4 h-4" /> },
  { view: "leaderboard", label: "Classement", icon: <Trophy className="w-4 h-4" /> },
  { view: "rules", label: "Règles", icon: <BookOpen className="w-4 h-4" /> },
];

export function Navbar() {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-3">
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-2 group shrink-0"
        >
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-[#ff3d8b] text-white font-black text-lg group-hover:scale-105 transition-transform box-glow-magenta">
            M
          </span>
          <span className="font-black text-lg tracking-tight">
            Math<span className="text-[#ff3d8b] text-glow-magenta">Arena</span>
          </span>
        </button>

        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {LINKS.map((l) => (
            <button
              key={l.view}
              onClick={() => setView(l.view)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                view === l.view
                  ? "bg-[#ff3d8b]/15 text-[#ff3d8b] border border-[#ff3d8b]/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              {l.icon}
              <span className="hidden sm:inline">{l.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
