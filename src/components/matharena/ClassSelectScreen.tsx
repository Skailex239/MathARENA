"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Btn, Panel, PageTitle, SectionLabel, RankBadge } from "./ui";
import { cn } from "@/lib/utils";
import { ArrowLeft, RefreshCw } from "lucide-react";

const COMP_MODES: { value: "RANKED" | "QUICK" | "BLITZ"; label: string; desc: string }[] = [
  { value: "RANKED", label: "Classé", desc: "Elo officiel. Difficulté adaptative." },
  { value: "QUICK", label: "Rapide", desc: "Sans enjeu. 8s par question." },
  { value: "BLITZ", label: "Blitz", desc: "3s par question. Impacte l'Elo." },
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

  const accentColor = isTraining ? "#f5deb3" : "#ff8c42";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button
        onClick={() => setView("home")}
        className="flex items-center gap-1.5 text-sm text-[#8b8270] hover:text-[#f5efe6] mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <PageTitle className="mb-1">
        {isTraining ? "Entraînement" : "Duel compétitif"}
      </PageTitle>
      <p className="text-sm text-[#c9bfb0] mb-6">
        {isTraining
          ? TRAINING_INFO[trainingExercise]?.desc ?? "Exercice d'entraînement."
          : "Configure ton match et lance le duel. Pur skill."}
      </p>

      <div className="space-y-5">
        {/* Entraînement : exercice sélectionné */}
        {isTraining && (
          <Panel className="p-4">
            <SectionLabel className="mb-2 block">Exercice</SectionLabel>
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {trainingExercise === "vsia" ? "🤖" : trainingExercise === "sprint" ? "⚡" : trainingExercise === "category" ? "🎯" : "🧩"}
              </span>
              <div>
                <div className="text-sm font-semibold text-[#f5deb3]">
                  {TRAINING_INFO[trainingExercise]?.name}
                </div>
                <div className="text-xs text-[#8b8270]">{TRAINING_INFO[trainingExercise]?.desc}</div>
              </div>
            </div>
          </Panel>
        )}

        {/* Mode (compétitif uniquement) */}
        {!isTraining && (
          <Panel className="p-4">
            <SectionLabel className="mb-3 block">Mode</SectionLabel>
            <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-[#252019] border border-[#4a4133]">
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
            <p className="text-xs text-[#8b8270] mt-2">
              {COMP_MODES.find((m) => m.value === mode)?.desc}
            </p>
          </Panel>
        )}

        {/* Adversaire (compétitif + Vs IA) */}
        {(!isTraining || trainingExercise === "vsia") && (
          <Panel className="p-4">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Adversaire</SectionLabel>
              <button
                onClick={() => setOpp(randomOpponent(opp))}
                className="flex items-center gap-1.5 text-xs text-[#8b8270] hover:text-[#ff8c42]"
              >
                <RefreshCw className="w-3 h-3" /> Changer
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-9 h-9 rounded-md bg-[#252019] border border-[#4a4133] text-sm font-semibold text-[#f5efe6]">
                {opp.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[#f5efe6]">{opp}</div>
                <div className="text-xs text-[#8b8270]">
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
