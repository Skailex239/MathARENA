"use client";

import { useApp } from "@/lib/store";

export function Footer() {
  const setView = useApp((s) => s.setView);
  return (
    <footer className="mt-auto border-t border-[#30363d] bg-[#0d1117]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="grid place-items-center w-7 h-7 rounded-md bg-[#2563eb] text-white font-black text-sm">M</span>
              <span className="font-display font-extrabold text-lg">
                Math<span className="text-[#2563eb]">Arena</span>
              </span>
            </div>
            <p className="text-sm text-[#8b949e] max-w-sm">
              La plateforme compétitive de duel 1v1 de calcul mental.{" "}
              <span className="text-white font-medium">Your brain is your weapon.</span>
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-2">Jeu</h4>
            <ul className="space-y-1.5 text-sm text-[#8b949e]">
              <li>
                <button onClick={() => setView("classselect")} className="hover:text-white transition-colors">Duel 1v1</button>
              </li>
              <li>5 classes · 7 sorts</li>
              <li>Elo & divisions</li>
              <li>Mode Blitz</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-2">Valeurs</h4>
            <ul className="space-y-1.5 text-sm text-[#8b949e]">
              <li>
                <button onClick={() => setView("rules")} className="hover:text-white transition-colors">Comment jouer</button>
              </li>
              <li>Jamais de pay-to-win</li>
              <li>Anti-triche serveur</li>
              <li>Dark-first</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-[#30363d] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8b949e]">
          <span>© {new Date().getFullYear()} MathArena. Tous droits réservés.</span>
          <span className="font-mono">v0.1 · bêta compétitive</span>
        </div>
      </div>
    </footer>
  );
}
