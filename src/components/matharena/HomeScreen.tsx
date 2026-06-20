"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { Btn, Panel, SectionLabel, RankBadge, OrnamentDivider } from "./ui";
import { api, type LeaderboardEntry, type MatchRecord } from "@/lib/api";
import { Swords, Trophy, Activity, Users, ChevronRight, Zap, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COMP_MODES = [
  { value: "RANKED", label: "Classique" },
  { value: "QUICK", label: "Rapide" },
  { value: "BLITZ", label: "Blitz" },
] as const;

const TRAINING_EXERCISES = [
  { id: "vsia", emoji: "🤖", name: "Vs IA", desc: "Difficulté adaptative à ton niveau" },
  { id: "sprint", emoji: "⚡", name: "Sprint solo", desc: "2 min de calcul mental non-stop" },
  { id: "category", emoji: "🎯", name: "Catégorie spécifique", desc: "Travaille tes points faibles" },
  { id: "daily", emoji: "🧩", name: "Défi du jour", desc: "Nouveau challenge chaque jour" },
  { id: "marathon", emoji: "🏁", name: "Marathon", desc: "50 questions, sans pression" },
] as const;

const NEWS = [
  { emoji: "🏆", title: "Saison 3 lancée", time: "il y a 2h", desc: "Nouvelles récompenses et reset Elo partiel." },
  { emoji: "⚔️", title: "Tournoi week-end", time: "hier", desc: "Bracket 32 joueurs, inscription gratuite." },
  { emoji: "🤖", title: "Boss IA", time: "il y a 2 jours", desc: "Premier à battre le boss gagne un titre." },
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

  const isTraining = universe === "arena";

  const launch = () => {
    setUniverse(isTraining ? "arena" : "competitive");
    if (isTraining) setTrainingExercise(exercise);
    else setSelection("guerrier", mode);
    setView("classselect");
  };

  const recentComp = recent.filter((m) => m.universe === "competitive").slice(0, 5);
  const accentColor = isTraining ? "#f0b27a" : "#e8823d";

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-8">
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* ===== COLONNE PRINCIPALE ===== */}
        <div className="space-y-5">
          {/* Play card */}
          <Panel className="p-6">
            {/* Mode tabs */}
            <div className="flex gap-6 border-b border-[#ebe2d2] mb-5">
              <button
                onClick={() => setUniverse("competitive")}
                className={cn(
                  "pb-2.5 -mb-px text-sm font-semibold transition-colors border-b-2",
                  !isTraining ? "border-[#e8823d] text-[#e8823d]" : "border-transparent text-[#9c8e7a] hover:text-[#6b5f4f]",
                )}
              >
                🏆 Compétitif
              </button>
              <button
                onClick={() => setUniverse("arena")}
                className={cn(
                  "pb-2.5 -mb-px text-sm font-semibold transition-colors border-b-2",
                  isTraining ? "border-[#f0b27a] text-[#f0b27a]" : "border-transparent text-[#9c8e7a] hover:text-[#6b5f4f]",
                )}
              >
                🎯 Entraînement
              </button>
            </div>

            {!isTraining ? (
              <>
                <h1 className="text-lg font-semibold text-[#2a2520] mb-4">Duel compétitif</h1>

                <SectionLabel className="mb-2 block">Mode</SectionLabel>
                <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-[#efe8db] border border-[#ebe2d2] mb-4">
                  {COMP_MODES.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className={cn(
                        "px-4 py-1.5 rounded text-sm font-medium transition-all",
                        mode === m.value
                          ? "bg-[#faf6f0] text-[#e8823d] shadow-sm border border-[#e8823d]/30"
                          : "text-[#9c8e7a] hover:text-[#2a2520]",
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <p className="text-sm text-[#6b5f4f] mb-5">
                  {mode === "RANKED" && "Premier à 10 points · 8s par question · Elo Classique"}
                  {mode === "QUICK" && "Premier à 5 points · 5s par question · Elo Rapide"}
                  {mode === "BLITZ" && "2 minutes · Plus de bonnes réponses gagne · Elo Blitz"}
                </p>

                <div className="flex justify-end">
                  <Btn onClick={launch} size="lg">
                    <Swords /> Lancer le match
                  </Btn>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-lg font-semibold text-[#2a2520] mb-1">Mode entraînement</h1>
                <p className="text-sm text-[#6b5f4f] mb-4">Aucun impact sur ton Elo. Zone safe.</p>

                <SectionLabel className="mb-2 block">Choisis ton exercice</SectionLabel>
                <div className="space-y-2 mb-5">
                  {TRAINING_EXERCISES.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => setExercise(ex.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-md border text-left transition-all",
                        exercise === ex.id
                          ? "border-[#f0b27a] bg-[rgba(240,178,122,0.06)]"
                          : "border-[#ebe2d2] hover:border-[#dcd0bc] hover:bg-[#efe8db]",
                      )}
                    >
                      <span className="text-xl">{ex.emoji}</span>
                      <div className="flex-1">
                        <div className={cn("text-sm font-semibold", exercise === ex.id ? "text-[#f0b27a]" : "text-[#2a2520]")}>{ex.name}</div>
                        <div className="text-xs text-[#9c8e7a]">{ex.desc}</div>
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
          <Panel className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="text-[#9c8e7a]" />
                <h2 className="text-sm font-semibold text-[#2a2520]">Derniers matchs</h2>
              </div>
              <button onClick={() => setView("profile")} className="text-xs text-[#9c8e7a] hover:text-[#e8823d] flex items-center gap-0.5 transition-colors">
                Tout voir <ChevronRight />
              </button>
            </div>
            {recentComp.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#9c8e7a]">Aucune partie jouée. Lance ton premier duel.</div>
            ) : (
              <div className="overflow-x-auto scrollbar-warm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ebe2d2] text-left">
                      <th className="py-1.5 px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[#9c8e7a]">Résultat</th>
                      <th className="py-1.5 px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[#9c8e7a]">Adversaire</th>
                      <th className="py-1.5 px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[#9c8e7a] hidden sm:table-cell">Mode</th>
                      <th className="py-1.5 px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[#9c8e7a] text-right">Elo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentComp.map((m) => (
                      <tr key={m.id} className="border-b border-[#ebe2d2] hover:bg-[#efe8db] transition-colors">
                        <td className="py-2 px-2">
                          <span className={cn("text-xs font-semibold", m.result === "WIN" ? "text-[#7a9b6e]" : "text-[#b5524a]")}>
                            {m.result === "WIN" ? "Victoire" : "Défaite"}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-[#6b5f4f]">{m.opponentName}</td>
                        <td className="py-2 px-2 text-[#9c8e7a] hidden sm:table-cell">{m.mode}</td>
                        <td className={cn("py-2 px-2 text-right font-mono text-xs", m.eloChange >= 0 ? "text-[#7a9b6e]" : "text-[#b5524a]")}>
                          {m.eloChange >= 0 ? "+" : ""}{m.eloChange}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {/* How it works */}
          <Panel className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-semibold text-[#2a2520]">Comment ça marche</h2>
            </div>
            <div className="space-y-3 text-sm text-[#6b5f4f]">
              <div className="flex gap-3">
                <span className="font-mono text-[#e8823d] font-bold shrink-0">01</span>
                <span>Les deux joueurs voient la <span className="text-[#2a2520] font-medium">même question</span> simultanément.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-mono text-[#e8823d] font-bold shrink-0">02</span>
                <span>Premier à répondre correctement marque <span className="text-[#2a2520] font-medium">1 point</span>.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-mono text-[#e8823d] font-bold shrink-0">03</span>
                <span>Mauvaise réponse = question <span className="text-[#2a2520] font-medium">verrouillée</span> pour toi.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-mono text-[#e8823d] font-bold shrink-0">04</span>
                <span>Premier à <span className="text-[#2a2520] font-medium">10 points</span> (Classique) ou <span className="text-[#2a2520] font-medium">5 points</span> (Rapide) remporte le duel.</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* ===== SIDEBAR DROITE ===== */}
        <aside className="space-y-5">
          {/* Online */}
          <Panel className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-[#7a9b6e]" />
              <SectionLabel>Joueurs en ligne</SectionLabel>
            </div>
            <div className="font-mono font-bold text-2xl text-[#2a2520]">
              {livePlayers.toLocaleString("fr-FR")}
            </div>
            <div className="text-xs text-[#9c8e7a] mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7a9b6e] inline-block" />
              En partie : {Math.floor(livePlayers * 0.36).toLocaleString("fr-FR")}
            </div>
          </Panel>

          <OrnamentDivider />

          {/* Top players */}
          <Panel className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="text-[#9c8e7a]" />
                <SectionLabel>Top — Compétitif</SectionLabel>
              </div>
              <button onClick={() => setView("leaderboard")} className="text-[#9c8e7a] hover:text-[#e8823d] text-xs transition-colors">→</button>
            </div>
            <div className="space-y-0.5">
              {top.slice(0, 6).map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setView("leaderboard")}
                  className={cn(
                    "w-full flex items-center gap-2 px-1.5 py-1.5 rounded text-sm hover:bg-[#efe8db] transition-colors",
                    p.isMe && "bg-[rgba(232,130,61,0.04)]",
                  )}
                >
                  <span className="font-mono text-xs text-[#9c8e7a] w-5 text-center">{i + 1}</span>
                  <span className="flex-1 text-left truncate text-[#2a2520]">{p.name}</span>
                  <RankBadge elo={p.elo} />
                  <span className="font-mono text-xs text-[#6b5f4f] w-10 text-right">{p.elo}</span>
                </button>
              ))}
              {top.length === 0 && <div className="py-4 text-center text-xs text-[#9c8e7a]">Chargement…</div>}
            </div>
          </Panel>

          <OrnamentDivider />

          {/* Live event */}
          <Panel className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b5524a] inline-block animate-pulse" />
              <SectionLabel>En direct</SectionLabel>
            </div>
            <div className="text-sm font-semibold text-[#2a2520]">Tournoi hebdo</div>
            <div className="text-xs text-[#9c8e7a] mt-0.5">dans 12:34 · 47 inscrits</div>
            <button
              onClick={() => toast("Inscription au tournoi bientôt disponible")}
              className="w-full mt-3 h-8 rounded-md border border-[#e8823d] text-[#e8823d] hover:bg-[#e8823d] hover:text-[#faf6f0] text-xs font-medium transition-all"
            >
              Rejoindre
            </button>
          </Panel>

          <OrnamentDivider />

          {/* News */}
          <Panel className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <SectionLabel>Actualités</SectionLabel>
            </div>
            <div className="space-y-3">
              {NEWS.map((n) => (
                <div key={n.title} className="border-l-2 border-[#ebe2d2] pl-3">
                  <div className="text-sm font-medium text-[#2a2520]">{n.emoji} {n.title}</div>
                  <div className="text-xs text-[#6b5f4f] mt-0.5">{n.desc}</div>
                  <div className="text-[10px] text-[#9c8e7a] mt-0.5 font-mono">{n.time}</div>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
