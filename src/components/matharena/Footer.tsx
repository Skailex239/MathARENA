"use client";

import { useApp } from "@/lib/store";

export function Footer() {
  const setView = useApp((s) => s.setView);
  return (
    <footer className="mt-auto py-6 border-t border-[#ebe2d2]">
      <div className="mx-auto max-w-7xl px-4 flex items-center justify-between gap-4 text-xs text-[#9c8e7a]">
        <span>
          <span className="font-medium text-[#6b5f4f]">MathArena</span> — Ton cerveau est ton arme.
        </span>
        <div className="flex items-center gap-4">
          <button onClick={() => setView("rules")} className="hover:text-[#e8823d] transition-colors">Règles</button>
          <button onClick={() => setView("classselect")} className="hover:text-[#e8823d] transition-colors">Jouer</button>
          <button onClick={() => setView("leaderboard")} className="hover:text-[#e8823d] transition-colors">Classement</button>
        </div>
      </div>
    </footer>
  );
}
