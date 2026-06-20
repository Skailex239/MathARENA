"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { Btn, Panel, SectionLabel, RankBadge, Tabs } from "./ui";
import { api, type LeaderboardEntry, type MatchRecord } from "@/lib/api";
import { Swords, Trophy, Activity, Users, ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Universe } from "@/lib/game/progression";

const MODE_TABS_COMP = [
  { value: "RANKED", label: "Classé" },
  { value: "QUICK", label: "Rapide" },
  { value: "BLITZ", label: "Blitz" },
] as const;

const MODE_TABS_ARENA = [
  { value: "RANKED", label: "Classé" },
  { value: "QUICK", label: "Rapide" },
  { value: "BLITZ", label: "Blitz" },
  { value: "PRACTICE", label: "Entraînement" },
] as const;

const NEWS = [
  { title: "Saison 3 lancée", time: "il y a 2h", desc: "Nouvelles récompenses et reset Elo partiel." },
  { title: "Tournoi du week-end", time: "hier", desc: "Bracket 32 joueurs, inscription gratuite." },
  { title: "Boss communautaire", time: "2 jours", desc: "Premier à battre le boss IA gagne un titre unique." },
];

function useLivePlayers() {
  const [n, setN] = useState(2341);
  useEffect(() => {
    const t = setInterval(() => {
      setN((prev) => Math.max(1800, Math.min(2800, prev + (Math.floor(Math.random() * 11) - 5))));
    }, 2500);
    return () => clearInterval(t);
  }, []);
  return n;
}

const UNIVERSE_TABS: { value: Universe; label: string }[] = [
  { value: "competitive", label: "Compétitif" },
  { value: "arena", label: "Arène" },
];

export function HomeScreen() {
  const setView = useApp((s) => s.setView);
  const setSelection = useApp((s) => s.setSelection);
  const setUniverse = useApp((s) => s.setUniverse);
  const universe = useApp((s) => s.universe);
  const livePlayers = useLivePlayers();
  const [top, setTop] = useState<LeaderboardEntry[]>([]);
  const [recent, setRecent] = useState<MatchRecord[]>([]);
  const [mode, setMode] = useState<(typeof MODE_TABS_COMP)[number]["value"]>("QUICK");

  useEffect(() => {
    api.getLeaderboard(universe).then(setTop).catch(() => {});
  }, [universe]);

  useEffect(() => {
    api.getMatches(5).then(setRecent).catch(() => {});
  }, []);

  const recentFiltered = recent.filter((m) => m.universe === universe);

  const quickPlay = () => {
    setSelection("guerrier", mode);
    setView("classselect");
  };

  const isArena = universe === "arena";

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 pb-6">
      {/* Universe switcher */}
      <div className="mb-4">
        <Tabs<Universe>
          options={UNIVERSE_TABS}
          value={universe}
          onChange={(u) => setUniverse(u)}
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* ===== COLONNE PRINCIPALE ===== */}
        <div className="space-y-6">
          {/* Play panel */}
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-[#3b82f6]" />
                <h1 className="text-lg font-semibold">
                  {isArena ? "Duel d'arène" : "Duel compétitif"}
                </h1>
              </div>
            </div>

            {/* Mode tabs */}
            <div className="mb-4">
              <SectionLabel className="mb-2 block">Mode</SectionLabel>
              <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-[#1c2128] border border-[#2d333b]">
                {(isArena ? MODE_TABS_ARENA : MODE_TABS_COMP).map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={cn(
                      "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                      mode === m.value ? "bg-[#3b82f6] text-white" : "text-[#9ba4b0] hover:text-[#e6edf3] hover:bg-[#22272e]",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-[#9ba4b0]">
                {isArena ? (
                  <>
                    Classes, sorts, PV et combos. Affronte l'IA en duel tactique.
                    {mode === "RANKED" && " Impacte ton Elo d'arène."}
                    {mode === "BLITZ" && " 3s par question. Impacte l'Elo."}
                    {mode === "PRACTICE" && " Sans Elo."}
                  </>
                ) : (
                  <>
                    Pur skill : même question, premier à 7 points gagne. Pas de classes ni de sorts.
                    {mode === "BLITZ" && " 3s par question."}
                    {mode === "RANKED" && " Elo officiel."}
                  </>
                )}
              </div>
              <Btn onClick={quickPlay} size="lg" className="shrink-0">
                <Swords className="w-4 h-4" /> Lancer
              </Btn>
            </div>
          </Panel>

          {/* Recent matches */}
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#9ba4b0]" />
                <h2 className="text-sm font-semibold">Parties récentes — {isArena ? "Arène" : "Compétitif"}</h2>
              </div>
              <button onClick={() => setView("profile")} className="text-xs text-[#9ba4b0] hover:text-[#3b82f6] flex items-center gap-0.5">
                Tout voir <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {recentFiltered.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#6e7681]">
                Aucune partie {isArena ? "d'arène" : "compétitive"}. Lance ton premier duel.
              </div>
            ) : (
              <div className="divide-y divide-[#232a33]">
                {recentFiltered.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className={cn("text-xs font-semibold w-10", m.result === "WIN" ? "text-[#2ea043]" : "text-[#f85149]")}>
                      {m.result === "WIN" ? "VICT" : "DEF"}
                    </span>
                    <span className="text-[#9ba4b0] flex-1 min-w-0 truncate">vs {m.opponentName}</span>
                    <span className="text-xs text-[#6e7681] hidden sm:inline">{m.mode}</span>
                    <span className={cn("font-mono text-xs w-12 text-right", m.eloChange >= 0 ? "text-[#2ea043]" : "text-[#f85149]")}>
                      {m.eloChange >= 0 ? "+" : ""}{m.eloChange}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Arena-only : classes overview ; Competitive : comment ça marche */}
          {isArena ? (
            <Panel className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Classes</h2>
                <button onClick={() => setView("rules")} className="text-xs text-[#9ba4b0] hover:text-[#3b82f6] flex items-center gap-0.5">
                  Détails <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {([
                  ["guerrier", "Guerrier", "120"],
                  ["mage", "Mage", "80"],
                  ["gardien", "Gardien", "100"],
                  ["assassin", "Assassin", "90"],
                  ["alchimiste", "Alchimiste", "100"],
                ] as const).map(([id, name, hp]) => (
                  <button
                    key={id}
                    onClick={() => { setSelection(id, mode); setView("classselect"); }}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-md border border-[#2d333b] hover:border-[#444c56] hover:bg-[#1c2128] transition-colors"
                  >
                    <span className="text-lg leading-none">{CLASS_ICON_ARENA[id]}</span>
                    <span className="text-xs font-medium">{name}</span>
                    <span className="text-[10px] font-mono text-[#6e7681]">{hp} PV</span>
                  </button>
                ))}
              </div>
            </Panel>
          ) : (
            <Panel className="p-5">
              <h2 className="text-sm font-semibold mb-3">Comment ça marche</h2>
              <div className="space-y-2 text-sm text-[#9ba4b0]">
                <div className="flex gap-2">
                  <span className="font-mono text-[#3b82f6] shrink-0">01</span>
                  <span>Les deux joueurs voient la <span className="text-[#e6edf3]">même question</span> simultanément.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-[#3b82f6] shrink-0">02</span>
                  <span>Le premier à répondre correctement marque <span className="text-[#e6edf3]">1 point</span>.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-[#3b82f6] shrink-0">03</span>
                  <span>Une mauvaise réponse <span className="text-[#e6edf3]">verrouille</span> la question pour toi.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-[#3b82f6] shrink-0">04</span>
                  <span>Premier à <span className="text-[#e6edf3]">7 points</span> remporte le duel.</span>
                </div>
              </div>
            </Panel>
          )}
        </div>

        {/* ===== SIDEBAR DROITE ===== */}
        <aside className="space-y-6">
          <Panel className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#2ea043]" />
              <SectionLabel>Joueurs en ligne</SectionLabel>
            </div>
            <div className="font-mono text-2xl font-medium text-[#e6edf3]">
              {livePlayers.toLocaleString("fr-FR")}
            </div>
            <div className="text-xs text-[#6e7681] mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ea043] inline-block" />
              En partie maintenant
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#9ba4b0]" />
                <SectionLabel>Top — {isArena ? "Arène" : "Compétitif"}</SectionLabel>
              </div>
              <button onClick={() => setView("leaderboard")} className="text-[#9ba4b0] hover:text-[#3b82f6]">
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {top.slice(0, 6).map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setView("leaderboard")}
                  className={cn(
                    "w-full flex items-center gap-2 px-1.5 py-1.5 rounded text-sm hover:bg-[#1c2128] transition-colors",
                    p.isMe && "bg-[rgba(59,130,246,0.08)]",
                  )}
                >
                  <span className="font-mono text-xs text-[#6e7681] w-5 text-center">{i + 1}</span>
                  <span className="flex-1 text-left truncate text-[#e6edf3]">{p.name}</span>
                  <RankBadge elo={p.elo} />
                  <span className="font-mono text-xs text-[#9ba4b0] w-10 text-right">{p.elo}</span>
                </button>
              ))}
              {top.length === 0 && (
                <div className="py-4 text-center text-xs text-[#6e7681]">Chargement…</div>
              )}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <SectionLabel>Actualités</SectionLabel>
            </div>
            <div className="space-y-3">
              {NEWS.map((n) => (
                <div key={n.title} className="border-l-2 border-[#2d333b] pl-3">
                  <div className="text-sm font-medium text-[#e6edf3]">{n.title}</div>
                  <div className="text-xs text-[#9ba4b0] mt-0.5">{n.desc}</div>
                  <div className="text-[10px] text-[#6e7681] mt-0.5 font-mono">{n.time}</div>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

const CLASS_ICON_ARENA: Record<string, string> = {
  guerrier: "⚔", mage: "✦", gardien: "⛨", assassin: "✕", alchimiste: "⚗",
};
