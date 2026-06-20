"use client";

import { useApp } from "@/lib/store";

export function Footer() {
  const setView = useApp((s) => s.setView);
  return (
    <footer className="mt-auto border-t border-[#2d333b] bg-[#0e1116]">
      <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6e7681]">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-5 h-5 rounded bg-[#3b82f6] text-white font-bold text-[10px]">M</span>
          <span>
            <span className="font-medium text-[#9ba4b0]">MathArena</span> — Your brain is your weapon.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setView("rules")} className="hover:text-[#e6edf3] transition-colors">Règles</button>
          <button onClick={() => setView("classselect")} className="hover:text-[#e6edf3] transition-colors">Jouer</button>
          <button onClick={() => setView("leaderboard")} className="hover:text-[#e6edf3] transition-colors">Classement</button>
          <span className="font-mono">v0.2</span>
        </div>
      </div>
    </footer>
  );
}
