"use client";

import { useApp } from "@/lib/store";

export function Footer() {
  const setView = useApp((s) => s.setView);
  return (
    <footer className="mt-auto border-t border-[#3a3328] bg-[#14110f]">
      <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8b8270]">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-5 h-5 rounded bg-[#ff8c42] text-[#14110f] font-bold text-[10px]">M</span>
          <span>
            <span className="font-medium text-[#c9bfb0]">MathArena</span> — Ton cerveau est ton arme.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setView("rules")} className="hover:text-[#f5efe6] transition-colors">Règles</button>
          <button onClick={() => setView("classselect")} className="hover:text-[#f5efe6] transition-colors">Jouer</button>
          <button onClick={() => setView("leaderboard")} className="hover:text-[#f5efe6] transition-colors">Classement</button>
          <span className="font-mono">v0.3</span>
        </div>
      </div>
    </footer>
  );
}
