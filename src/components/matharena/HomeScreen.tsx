"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { Btn, Panel, SectionLabel, RankBadge } from "./ui";
import { api, type LeaderboardEntry, type MatchRecord } from "@/lib/api";
import { Swords, Trophy, Activity, Users, ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MODE_TABS = [
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

function classEmoji(c: string | null): string {
  const map: Record<string, string> = {
    guerrier: "⚔", mage: "✦", gardien: "⛨", assassin: "✕", alchimiste: "⚗",
  };
  return c ? map[c] ?? "·" : "·";
}

export function HomeScreen() {
  const setView = useApp((s) => s.setView);
  const setSelection = useApp((s) => s.setSelection);
  const livePlayers = useLivePlayers();
  const [top, setTop] = useState<LeaderboardEntry[]>([]);
  const [recent, setRecent] = useState<MatchRecord[]>([]);
  const [mode, setMode] = useState<(typeof MODE_TABS)[number]["value"]>("QUICK");

  useEffect(() => {
    api.getLeaderboard().then(setTop).catch(() => {});
    api.getMatches(5).then(setRecent).catch(() => {});
  }, []);

  const quickPlay = () => {
    setSelection("guerrier", mode);
    setView("classselect");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-6">
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* ===== COLONNE PRINCIPALE : PLAY ===== */}
        <div className="space-y-6">
          {/* Play panel */}
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-[#3b82f6]" />
                <h1 className="text-lg font-semibold">Jouer</h1>
              </div>
            </div>

            {/* Mode tabs */}
            <div className="mb-4">
              <SectionLabel className="mb-2 block">Mode de jeu</SectionLabel>
              <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-[#1c2128] border border-[#2d333b]">
                {MODE_TABS.map((m) => (
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
                {mode === "RANKED" && "Matchmaking par Elo. Difficulté adaptative. Impacte ton classement."}
                {mode === "QUICK" && "Sans enjeu. 10s par question. Pour s'échauffer."}
                {mode === "BLITZ" && "3s par question. Ultra rapide. Impacte l'Elo."}
                {mode === "PRACTICE" && "Contre une IA adaptative. Sans Elo. Pour progresser."}
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
                <h2 className="text-sm font-semibold">Parties récentes</h2>
              </div>
              <button onClick={() => setView("profile")} className="text-xs text-[#9ba4b0] hover:text-[#3b82f6] flex items-center gap-0.5">
                Tout voir <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {recent.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#6e7681]">
                Aucune partie jouée. Lance ton premier duel.
              </div>
            ) : (
              <div className="divide-y divide-[#232a33]">
                {recent.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className={cn("text-xs font-semibold w-10", m.result === "WIN" ? "text-[#2ea043]" : "text-[#f85149]")}>
                      {m.result === "WIN" ? "VICT" : "DEF"}
                    </span>
                    <span className="text-[#9ba4b0] flex-1 min-w-0 truncate">
                      vs {m.opponentName}
                    </span>
                    <span className="text-xs text-[#6e7681] hidden sm:inline">{m.mode}</span>
                    <span className={cn("font-mono text-xs w-12 text-right", m.eloChange >= 0 ? "text-[#2ea043]" : "text-[#f85149]")}>
                      {m.eloChange >= 0 ? "+" : ""}{m.eloChange}
                    </span>
                    <span className="font-mono text-xs text-[#6e7681] w-10 text-right">{m.maxCombo}x</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Classes overview */}
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
                  <span className="text-lg leading-none">{classEmoji(id)}</span>
                  <span className="text-xs font-medium">{name}</span>
                  <span className="text-[10px] font-mono text-[#6e7681]">{hp} PV</span>
                </button>
              ))}
            </div>
          </Panel>
        </div>

        {/* ===== SIDEBAR DROITE ===== */}
        <aside className="space-y-6">
          {/* Online players */}
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

          {/* Leaderboard preview */}
          <Panel className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#9ba4b0]" />
                <SectionLabel>Top joueurs</SectionLabel>
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

          {/* News */}
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
