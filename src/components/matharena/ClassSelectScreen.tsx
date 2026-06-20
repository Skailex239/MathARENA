"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Btn, Panel, PageTitle, SectionLabel, RankBadge } from "./ui";
import { cn } from "@/lib/utils";
import { ArrowLeft, RefreshCw } from "lucide-react";

const COMP_MODES: { value: "RANKED" | "QUICK" | "BLITZ"; label: string; desc: string }[] = [
  { value: "RANKED", label: "Classique", desc: "Premier à 10 points · 8s/question · Elo Classique" },
  { value: "QUICK", label: "Rapide", desc: "Premier à 5 points · 5s/question · Elo Rapide" },
  { value: "BLITZ", label: "Blitz", desc: "2 minutes · Plus de bonnes réponses · Elo Blitz" },
];

const OPPONENTS = [
  "Vortex", "NeuroBlade", "PyroMath", "CalcQueen", "ZeroChill",
  "Quanta", "PrimeTime", "Sigma", "Hexa", "Omega",
];

function randomOpponent(exclude?: string) {
  const pool = exclude ? OPPONENTS.filter((o) => o !== exclude) : OPPONENTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

const TRAINING_INFO: Record<string, { name: string; desc: string }> = {
  vsia: { name: "Vs IA", desc: "Adversaire IA à difficulté adaptative." },
  sprint: { name: "Sprint solo", desc: "2 minutes de calcul mental non-stop." },
  category: { name: "Catégorie spécifique", desc: "Travaille une catégorie de calcul." },
  daily: { name: "Défi du jour", desc: "Challenge unique quotidien." },
  marathon: { name: "Marathon", desc: "50 questions, sans pression de temps." },
};

export function ClassSelectScreen() {
  const setView = useApp((s) => s.setView);
  const setSelection = useApp((s) => s.setSelection);
  const setOpponent = useApp((s) => s.setOpponent);
  const setUniverse = useApp((s) => s.setUniverse);
  const selectedMode = useApp((s) => s.selectedMode);
  const universe = useApp((s) => s.universe);
  const trainingExercise = useApp((s) => s.trainingExercise);
  const opponentName = useApp((s) => s.opponentName);

  const isTraining = universe === "arena";

  const [mode, setMode] = useState<"RANKED" | "QUICK" | "BLITZ">(
    (selectedMode as "RANKED" | "QUICK" | "BLITZ") || "QUICK",
  );
  const [opp, setOpp] = useState(opponentName || randomOpponent());

  const launch = () => {
    setSelection("guerrier", mode);
    setOpponent("guerrier", opp);
    setUniverse(isTraining ? "arena" : "competitive");
    setView("duel");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button
        onClick={() => setView("home")}
        className="flex items-center gap-1.5 text-sm text-[#9c8e7a] hover:text-[#2a2520] mb-4 transition-colors"
      >
        <ArrowLeft /> Retour
      </button>

      <PageTitle className="mb-1">
        {isTraining ? "Entraînement" : "Duel compétitif"}
      </PageTitle>
      <p className="text-sm text-[#6b5f4f] mb-6">
        {isTraining
          ? TRAINING_INFO[trainingExercise]?.desc ?? "Exercice d'entraînement."
          : "Configure ton match et lance le duel. Pur skill."}
      </p>

      <div className="space-y-5">
        {/* Entraînement : exercice sélectionné */}
        {isTraining && (
          <Panel className="p-5">
            <SectionLabel className="mb-2 block">Exercice</SectionLabel>
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {trainingExercise === "vsia" ? "🤖" : trainingExercise === "sprint" ? "⚡" : trainingExercise === "category" ? "🎯" : trainingExercise === "daily" ? "🧩" : "🏁"}
              </span>
              <div>
                <div className="text-sm font-semibold text-[#f0b27a]">
                  {TRAINING_INFO[trainingExercise]?.name}
                </div>
                <div className="text-xs text-[#9c8e7a]">{TRAINING_INFO[trainingExercise]?.desc}</div>
              </div>
            </div>
          </Panel>
        )}

        {/* Mode (compétitif uniquement) */}
        {!isTraining && (
          <Panel className="p-5">
            <SectionLabel className="mb-3 block">Mode</SectionLabel>
            <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-[#efe8db] border border-[#ebe2d2]">
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
            <p className="text-xs text-[#9c8e7a] mt-2">
              {COMP_MODES.find((m) => m.value === mode)?.desc}
            </p>
          </Panel>
        )}

        {/* Adversaire */}
        {(!isTraining || trainingExercise === "vsia") && (
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Adversaire</SectionLabel>
              <button
                onClick={() => setOpp(randomOpponent(opp))}
                className="flex items-center gap-1.5 text-xs text-[#9c8e7a] hover:text-[#e8823d] transition-colors"
              >
                <RefreshCw /> Changer
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-9 h-9 rounded-md bg-[#efe8db] border border-[#ebe2d2] text-sm font-semibold text-[#2a2520]">
                {opp.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[#2a2520]">{opp}</div>
                <div className="text-xs text-[#9c8e7a]">
                  {isTraining ? "IA adaptative" : "Adversaire pairé à ton Elo"}
                </div>
              </div>
              <RankBadge elo={1000} />
            </div>
          </Panel>
        )}

        {/* CTA */}
        <div className="flex justify-end">
          <Btn
            variant={isTraining ? "training" : "primary"}
            onClick={launch}
            size="lg"
          >
            {isTraining ? "🎯 Commencer" : "Lancer le duel"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
