"use client";

import { useApp, type View } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Trophy, User, Swords, Home, BookOpen } from "lucide-react";
import { toast } from "sonner";

const LINKS: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: "home", label: "Accueil", icon: <Home /> },
  { view: "classselect", label: "Jouer", icon: <Swords /> },
  { view: "leaderboard", label: "Classement", icon: <Trophy /> },
  { view: "profile", label: "Profil", icon: <User /> },
  { view: "rules", label: "Règles", icon: <BookOpen /> },
];

export function Navbar() {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);

  return (
    <header className="sticky top-0 z-40 border-b border-[#ebe2d2] bg-[#f5efe6]/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between gap-3">
        <button onClick={() => setView("home")} className="flex items-center gap-2 group shrink-0">
          <span className="grid place-items-center w-7 h-7 rounded-md bg-[#e8823d] text-[#faf6f0] font-bold text-sm">
            M
          </span>
          <span className="font-semibold text-sm tracking-[-0.01em] text-[#2a2520]">
            Math<span className="text-[#e8823d]">Arena</span>
          </span>
        </button>

        <nav className="flex items-center gap-0.5">
          {LINKS.map((l) => (
            <button
              key={l.view}
              onClick={() => setView(l.view)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
                view === l.view
                  ? "bg-[#efe8db] text-[#2a2520]"
                  : "text-[#9c8e7a] hover:text-[#2a2520] hover:bg-[#efe8db]",
              )}
            >
              {l.icon}
              <span className="hidden sm:inline">{l.label}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={() => toast("Connexion bientôt disponible", { description: "Auth Google/Discord : prochaine phase." })}
          className="shrink-0 hidden md:inline-flex items-center h-8 px-4 rounded-md border border-[#e8823d] text-[#e8823d] hover:bg-[#e8823d] hover:text-[#faf6f0] text-sm font-medium transition-all"
        >
          Connexion
        </button>
      </div>
    </header>
  );
}
