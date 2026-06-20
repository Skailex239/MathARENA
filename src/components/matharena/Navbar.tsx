"use client";

import { useApp, type View } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Btn } from "./ui";
import { Trophy, User, Swords, Home as HomeIcon } from "lucide-react";
import { toast } from "sonner";

const LINKS: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: "home", label: "Accueil", icon: <HomeIcon className="w-4 h-4" /> },
  { view: "classselect", label: "Jouer", icon: <Swords className="w-4 h-4" /> },
  { view: "leaderboard", label: "Classement", icon: <Trophy className="w-4 h-4" /> },
  { view: "profile", label: "Profil", icon: <User className="w-4 h-4" /> },
];

export function Navbar() {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);

  return (
    <header className="sticky top-0 z-40 border-b border-[#2d333b] bg-[#0e1116]">
      <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between gap-3">
        <button onClick={() => setView("home")} className="flex items-center gap-2 group shrink-0">
          <span className="grid place-items-center w-7 h-7 rounded-md bg-[#3b82f6] text-white font-bold text-sm">
            M
          </span>
          <span className="font-semibold text-sm tracking-tight">
            Math<span className="text-[#3b82f6]">Arena</span>
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
                  ? "bg-[#1c2128] text-[#e6edf3]"
                  : "text-[#9ba4b0] hover:text-[#e6edf3] hover:bg-[#1c2128]",
              )}
            >
              {l.icon}
              <span className="hidden sm:inline">{l.label}</span>
            </button>
          ))}
        </nav>

        <Btn
          variant="secondary"
          size="sm"
          className="shrink-0 hidden md:inline-flex"
          onClick={() => toast("Connexion bientôt disponible", { description: "Auth Google/Discord : prochaine phase." })}
        >
          Connexion
        </Btn>
      </div>
    </header>
  );
}
