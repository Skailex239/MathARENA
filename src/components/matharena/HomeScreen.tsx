"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { Btn, Panel, SectionLabel, RankBadge } from "./ui";
import { api, type LeaderboardEntry, type MatchRecord } from "@/lib/api";
import { Swords, Trophy, Activity, Users, ChevronRight, Flame, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Universe } from "@/lib/game/progression";

const COMP_MODES = [
  { value: "RANKED", label: "Classé" },
  { value: "QUICK", label: "Rapide" },
  { value: "BLITZ", label: "Blitz" },
] as const;

const TRAINING_EXERCISES = [
  { id: "vsia", emoji: "🤖", name: "Vs IA", desc: "Difficulté adaptative à ton niveau" },
  { id: "sprint", emoji: "⚡", name: "Sprint solo", desc: "2 min de calcul mental non-stop" },
  { id: "category", emoji: "🎯", name: "Catégorie spécifique", desc: "Travaille tes points faibles" },
  { id: "daily", emoji: "🧩", name: "Défi du jour", desc: "Nouveau challenge chaque jour" },
] as const;

const NEWS = [
  { emoji: "🏆", title: "Saison 3 lancée", time: "il y a 2h", desc: "Nouvelles récompenses et reset Elo partiel." },
  { emoji: "⚔️", title: "Tournoi week-end", time: "hier", desc: "Bracket 32 joueurs, inscription gratuite." },
  { emoji: "🤖", title: "Boss IA", time: "il y a 2 jours", desc: "Premier à battre le boss gagne un titre unique." },
];

function useLivePlayers() {
  const [n, setN] = useState(2349);
  useEffect(() => {
    const t = setInterval(() => {
      setN((prev) => Math.max(1800, Math.min(2800, prev + (Math.floor(Math.random() * 11) - 5))));
    }, 2500);
    return () => clearInterval(t);
  }, []);
  return n;
}

export function HomeScreen() {
  const setView = useApp((s) => s.setView);
  const setSelection = useApp((s) => s.setSelection);
  const setUniverse = useApp((s) => s.setUniverse);
  const setTrainingExercise = useApp((s) => s.setTrainingExercise);
  const universe = useApp((s) => s.universe);
  const livePlayers = useLivePlayers();
  const [top, setTop] = useState<LeaderboardEntry[]>([]);
  const [recent, setRecent] = useState<MatchRecord[]>([]);
  const [mode, setMode] = useState<(typeof COMP_MODES)[number]["value"]>("QUICK");
  const [exercise, setExercise] = useState<(typeof TRAINING_EXERCISES)[number]["id"]>("sprint");

  useEffect(() => {
    api.getLeaderboard("competitive").then(setTop).catch(() => {});
  }, []);
  useEffect(() => {
    api.getMatches(6).then(setRecent).catch(() => {});
  }, []);

  const isTraining = universe === "arena"; // "arena" = Entraînement côté UI

  const launch = () => {
    setUniverse(isTraining ? "arena" : "competitive");
    if (isTraining) setTrainingExercise(exercise);
    else setSelection("guerrier", mode);
    setView("classselect");
  };

  const recentComp = recent.filter((m) => m.universe === "competitive").slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-8">
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* ===== COLONNE PRINCIPALE ===== */}
        <div className="space-y-5">
          {/* Play card */}
          <Panel className="p-5">
            {/* Mode tabs (Compétitif / Entraînement) */}
            <div className="flex gap-6 border-b border-[#3a3328] mb-4">
              <button
                onClick={() => setUniverse("competitive")}
                className={cn(
                  "pb-2.5 -mb-px text-sm font-semibold transition-colors border-b-2",
                  !isTraining ? "border-[#ff8c42] text-[#ff8c42]" : "border-transparent text-[#8b8270] hover:text-[#c9bfb0]",
                )}
              >
                🏆 Compétitif
              </button>
              <button
                onClick={() => setUniverse("arena")}
                className={cn(
                  "pb-2.5 -mb-px text-sm font-semibold transition-colors border-b-2",
                  isTraining ? "border-[#f5deb3] text-[#f5deb3]" : "border-transparent text-[#8b8270] hover:text-[#c9bfb0]",
                )}
              >
                🎯 Entraînement
              </button>
            </div>

            {!isTraining ? (
              <>
                <h1 className="text-lg font-semibold text-[#f5efe6] mb-4">Duel compétitif</h1>

                <SectionLabel className="mb-2 block">Mode</SectionLabel>
                <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-[#252019] border border-[#4a4133] mb-4">
                  {COMP_MODES.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className={cn(
                        "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                        mode === m.value ? "bg-[#ff8c42] text-[#14110f]" : "text-[#8b8270] hover:text-[#f5efe6] hover:bg-[#2e2820]",
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-[#c9bfb0]">
                    Premier à 7 points · Elo officiel · Pur skill
                    {mode === "BLITZ" && " · 3s par question"}
                    {mode === "RANKED" && " · Difficulté adaptative"}
                  </p>
                  <Btn onClick={launch} size="lg" className="shrink-0">
                    <Swords className="w-4 h-4" /> Lancer le match
                  </Btn>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-lg font-semibold text-[#f5efe6] mb-1">Mode entraînement</h1>
                <p className="text-sm text-[#c9bfb0] mb-4">Aucun impact sur ton Elo. Zone safe.</p>

                <SectionLabel className="mb-2 block">Choisis ton exercice</SectionLabel>
                <div className="space-y-2 mb-4">
                  {TRAINING_EXERCISES.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => setExercise(ex.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-[10px] border text-left transition-colors",
                        exercise === ex.id
                          ? "border-[#f5deb3] bg-[rgba(245,222,179,0.06)]"
                          : "border-[#4a4133] hover:border-[#5c5142] hover:bg-[#252019]",
                      )}
                    >
                      <span className="text-xl">{ex.emoji}</span>
                      <div className="flex-1">
                        <div className={cn("text-sm font-semibold", exercise === ex.id ? "text-[#f5deb3]" : "text-[#f5efe6]")}>{ex.name}</div>
                        <div className="text-xs text-[#8b8270]">{ex.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Btn variant="training" onClick={launch} size="lg">
                    🎯 Commencer
                  </Btn>
                </div>
              </>
            )}
          </Panel>

          {/* Recent matches */}
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#8b8270]" />
                <h2 className="text-sm font-semibold text-[#f5efe6]">Derniers matchs</h2>
              </div>
              <button onClick={() => setView("profile")} className="text-xs text-[#8b8270] hover:text-[#ff8c42] flex items-center gap-0.5">
                Tout voir <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {recentComp.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#8b8270]">Aucune partie jouée. Lance ton premier duel.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#3a3328] text-left">
                    <th className="py-1.5 px-2 text-xs font-medium uppercase tracking-wider text-[#8b8270]">Résultat</th>
                    <th className="py-1.5 px-2 text-xs font-medium uppercase tracking-wider text-[#8b8270]">Adversaire</th>
                    <th className="py-1.5 px-2 text-xs font-medium uppercase tracking-wider text-[#8b8270] hidden sm:table-cell">Mode</th>
                    <th className="py-1.5 px-2 text-xs font-medium uppercase tracking-wider text-[#8b8270] text-right">Elo</th>
                  </tr>
                </thead>
                <tbody>
                  {recentComp.map((m) => (
                    <tr key={m.id} className="border-b border-[#3a3328] hover:bg-[#2e2820] transition-colors">
                      <td className="py-2 px-2">
                        <span className={cn("text-xs font-semibold", m.result === "WIN" ? "text-[#8faf7e]" : "text-[#c45a4a]")}>
                          {m.result === "WIN" ? "Victoire" : "Défaite"}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-[#c9bfb0]">{m.opponentName}</td>
                      <td className="py-2 px-2 text-[#8b8270] hidden sm:table-cell">{m.mode}</td>
                      <td className={cn("py-2 px-2 text-right font-mono text-xs", m.eloChange >= 0 ? "text-[#8faf7e]" : "text-[#c45a4a]")}>
                        {m.eloChange >= 0 ? "+" : ""}{m.eloChange}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          {/* How it works */}
          <Panel className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">ℹ️</span>
              <h2 className="text-sm font-semibold text-[#f5efe6]">Comment ça marche</h2>
            </div>
            <div className="space-y-2.5 text-sm text-[#c9bfb0]">
              <div className="flex gap-3">
                <span className="font-mono text-[#ff8c42] shrink-0">01</span>
                <span>Les deux joueurs voient la <span className="text-[#f5efe6]">même question</span> simultanément.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-mono text-[#ff8c42] shrink-0">02</span>
                <span>Premier à répondre correctement marque <span className="text-[#f5efe6]">1 point</span>.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-mono text-[#ff8c42] shrink-0">03</span>
                <span>Mauvaise réponse = question <span className="text-[#f5efe6]">verrouillée</span> pour toi.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-mono text-[#ff8c42] shrink-0">04</span>
                <span>Premier à <span className="text-[#f5efe6]">7 points</span> remporte le duel.</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* ===== SIDEBAR DROITE ===== */}
        <aside className="space-y-5">
          {/* Online */}
          <Panel className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#8faf7e]" />
              <SectionLabel>Joueurs en ligne</SectionLabel>
            </div>
            <div className="font-mono text-2xl font-medium text-[#f5efe6]">
              {livePlayers.toLocaleString("fr-FR")}
            </div>
            <div className="text-xs text-[#8b8270] mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8faf7e] inline-block" />
              En partie : {Math.floor(livePlayers * 0.36).toLocaleString("fr-FR")}
            </div>
          </Panel>

          {/* Top players */}
          <Panel className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#8b8270]" />
                <SectionLabel>Top — Compétitif</SectionLabel>
              </div>
              <button onClick={() => setView("leaderboard")} className="text-[#8b8270] hover:text-[#ff8c42] text-xs">
                →
              </button>
            </div>
            <div className="space-y-0.5">
              {top.slice(0, 6).map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setView("leaderboard")}
                  className={cn(
                    "w-full flex items-center gap-2 px-1.5 py-1.5 rounded text-sm hover:bg-[#252019] transition-colors",
                    p.isMe && "bg-[rgba(255,140,66,0.06)]",
                  )}
                >
                  <span className="font-mono text-xs text-[#8b8270] w-5 text-center">{i + 1}</span>
                  <span className="flex-1 text-left truncate text-[#f5efe6]">{p.name}</span>
                  <RankBadge elo={p.elo} />
                  <span className="font-mono text-xs text-[#c9bfb0] w-10 text-right">{p.elo}</span>
                </button>
              ))}
              {top.length === 0 && (
                <div className="py-4 text-center text-xs text-[#8b8270]">Chargement…</div>
              )}
            </div>
          </Panel>

          {/* Live event */}
          <Panel className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c45a4a] inline-block animate-pulse" />
              <SectionLabel>En direct</SectionLabel>
            </div>
            <div className="text-sm font-medium text-[#f5efe6]">Tournoi hebdo</div>
            <div className="text-xs text-[#8b8270] mt-0.5">dans 12:34 · 47 inscrits</div>
            <Btn variant="secondary" size="sm" className="w-full mt-3 justify-center">
              Rejoindre
            </Btn>
          </Panel>

          {/* News */}
          <Panel className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <SectionLabel>Actualités</SectionLabel>
            </div>
            <div className="space-y-3">
              {NEWS.map((n) => (
                <div key={n.title} className="border-l-2 border-[#3a3328] pl-3">
                  <div className="text-sm font-medium text-[#f5efe6]">{n.emoji} {n.title}</div>
                  <div className="text-xs text-[#c9bfb0] mt-0.5">{n.desc}</div>
                  <div className="text-[10px] text-[#8b8270] mt-0.5 font-mono">{n.time}</div>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
