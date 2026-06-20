"use client";

import { useApp, type View } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Trophy, User, Swords, Home as HomeIcon, BookOpen } from "lucide-react";
import { toast } from "sonner";

const LINKS: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: "home", label: "Accueil", icon: <HomeIcon className="w-4 h-4" /> },
  { view: "classselect", label: "Jouer", icon: <Swords className="w-4 h-4" /> },
  { view: "leaderboard", label: "Classement", icon: <Trophy className="w-4 h-4" /> },
  { view: "profile", label: "Profil", icon: <User className="w-4 h-4" /> },
  { view: "rules", label: "Règles", icon: <BookOpen className="w-4 h-4" /> },
];

export function Navbar() {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);

  return (
    <header className="sticky top-0 z-40 border-b border-[#3a3328] bg-[#14110f]">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between gap-3">
        <button onClick={() => setView("home")} className="flex items-center gap-2 group shrink-0">
          <span className="grid place-items-center w-7 h-7 rounded-md bg-[#ff8c42] text-[#14110f] font-bold text-sm">
            M
          </span>
          <span className="font-semibold text-sm tracking-tight">
            Math<span className="text-[#ff8c42]">Arena</span>
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
                  ? "bg-[#252019] text-[#f5efe6]"
                  : "text-[#8b8270] hover:text-[#f5efe6] hover:bg-[#252019]",
              )}
            >
              {l.icon}
              <span className="hidden sm:inline">{l.label}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={() => toast("Connexion bientôt disponible", { description: "Auth Google/Discord : prochaine phase." })}
          className="shrink-0 hidden md:inline-flex items-center h-8 px-3 rounded-md border border-[#4a4133] text-[#c9bfb0] hover:bg-[#2e2820] hover:text-[#f5efe6] text-sm transition-colors"
        >
          Connexion
        </button>
      </div>
    </header>
  );
}
