"use client";

import { useApp, type View } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Btn } from "./ui";
import { Trophy, User, Swords, Home as HomeIcon, LogIn } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b border-[#30363d] bg-[rgba(13,17,23,0.85)] backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between gap-3">
        <button onClick={() => setView("home")} className="flex items-center gap-2 group shrink-0">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-[#2563eb] text-white font-black text-lg group-hover:scale-105 transition-transform glow-blue">
            M
          </span>
          <span className="font-display font-extrabold text-lg tracking-tight">
            Math<span className="text-[#2563eb] text-glow-blue">Arena</span>
          </span>
        </button>

        <nav className="flex items-center gap-1">
          {LINKS.map((l) => (
            <button
              key={l.view}
              onClick={() => setView(l.view)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors min-h-9",
                view === l.view
                  ? "bg-[rgba(37,99,235,0.15)] text-[#2563eb]"
                  : "text-[#8b949e] hover:text-white hover:bg-[#21262d]",
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
          onClick={() => toast("Connexion bientôt disponible", { description: "L'auth Google/Discord arrive dans une prochaine phase." })}
        >
          <LogIn className="w-4 h-4" /> Connexion
        </Btn>
      </div>
    </header>
  );
}
