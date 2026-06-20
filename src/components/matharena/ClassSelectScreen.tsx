"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { CLASS_LIST, CLASSES } from "@/lib/game/classes";
import type { ClassId, GameMode } from "@/lib/game/types";
import { Btn, Panel, PageTitle, SectionLabel, RankBadge } from "./ui";
import { cn } from "@/lib/utils";
import { ArrowLeft, RefreshCw } from "lucide-react";

const MODE_TABS: { value: GameMode; label: string; desc: string }[] = [
  { value: "RANKED", label: "Classé", desc: "Matchmaking par Elo. Difficulté adaptative." },
  { value: "QUICK", label: "Rapide", desc: "Sans enjeu. 10s par question." },
  { value: "BLITZ", label: "Blitz", desc: "3s par question. Impacte l'Elo." },
  { value: "PRACTICE", label: "Entraînement", desc: "Vs IA. Sans Elo." },
];

const OPPONENTS: { name: string; classId: ClassId }[] = [
  { name: "Vortex", classId: "assassin" },
  { name: "NeuroBlade", classId: "assassin" },
  { name: "PyroMath", classId: "mage" },
  { name: "CalcQueen", classId: "mage" },
  { name: "ZeroChill", classId: "gardien" },
  { name: "Quanta", classId: "gardien" },
  { name: "PrimeTime", classId: "guerrier" },
  { name: "Sigma", classId: "guerrier" },
  { name: "Hexa", classId: "alchimiste" },
  { name: "Omega", classId: "alchimiste" },
];

function randomOpponent(exclude?: string) {
  const pool = exclude ? OPPONENTS.filter((o) => o.name !== exclude) : OPPONENTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

const CLASS_ICON: Record<ClassId, string> = {
  guerrier: "⚔", mage: "✦", gardien: "⛨", assassin: "✕", alchimiste: "⚗",
};

export function ClassSelectScreen() {
  const setView = useApp((s) => s.setView);
  const setSelection = useApp((s) => s.setSelection);
  const setOpponent = useApp((s) => s.setOpponent);
  const selectedClass = useApp((s) => s.selectedClass);
  const selectedMode = useApp((s) => s.selectedMode);

  const [cls, setCls] = useState<ClassId>(selectedClass);
  const [mode, setMode] = useState<GameMode>(selectedMode);
  const [opp, setOpp] = useState(() => randomOpponent());

  const oppDef = CLASSES[opp.classId];
  const def = CLASSES[cls];

  const launch = () => {
    setSelection(cls, mode);
    setOpponent(opp.classId, opp.name);
    setView("duel");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button
        onClick={() => setView("home")}
        className="flex items-center gap-1.5 text-sm text-[#9ba4b0] hover:text-[#e6edf3] mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <PageTitle className="mb-1">Nouvelle partie</PageTitle>
      <p className="text-sm text-[#9ba4b0] mb-6">Configure ta partie et lance le duel.</p>

      <div className="space-y-5">
        {/* Mode */}
        <Panel className="p-4">
          <SectionLabel className="mb-3 block">Mode</SectionLabel>
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
          <p className="text-xs text-[#6e7681] mt-2">
            {MODE_TABS.find((m) => m.value === mode)?.desc}
          </p>
        </Panel>

        {/* Classe */}
        <Panel className="p-4">
          <SectionLabel className="mb-3 block">Classe</SectionLabel>
          <div className="grid grid-cols-5 gap-2">
            {CLASS_LIST.map((c) => {
              const active = c.id === cls;
              return (
                <button
                  key={c.id}
                  onClick={() => setCls(c.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-md border transition-colors",
                    active
                      ? "border-[#3b82f6] bg-[rgba(59,130,246,0.08)]"
                      : "border-[#2d333b] hover:border-[#444c56] hover:bg-[#1c2128]",
                  )}
                >
                  <span className="text-xl leading-none text-[#e6edf3]">{CLASS_ICON[c.id]}</span>
                  <span className={cn("text-xs font-medium", active ? "text-[#3b82f6]" : "text-[#e6edf3]")}>{c.name}</span>
                  <span className="text-[10px] font-mono text-[#6e7681]">{c.hp} PV</span>
                </button>
              );
            })}
          </div>

          {/* détail classe sobre, en texte */}
          <div className="mt-3 pt-3 border-t border-[#232a33] grid sm:grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#6e7681] mb-0.5">Passif</div>
              <div className="text-[#e6edf3] font-medium">{def.passive.name}</div>
              <div className="text-[#9ba4b0] mt-0.5 leading-snug">{def.passive.description}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#6e7681] mb-0.5">Ultime</div>
              <div className="text-[#e6edf3] font-medium">{def.ultimate.name}</div>
              <div className="text-[#9ba4b0] mt-0.5 leading-snug">{def.ultimate.description}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#6e7681] mb-0.5">Faiblesse</div>
              <div className="text-[#9ba4b0] leading-snug">{def.weakness}</div>
            </div>
          </div>
        </Panel>

        {/* Adversaire */}
        <Panel className="p-4">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Adversaire</SectionLabel>
            <button
              onClick={() => setOpp(randomOpponent(opp.name))}
              className="flex items-center gap-1.5 text-xs text-[#9ba4b0] hover:text-[#3b82f6]"
            >
              <RefreshCw className="w-3 h-3" /> Changer
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl text-[#e6edf3]">{CLASS_ICON[opp.classId]}</span>
            <div className="flex-1">
              <div className="text-sm font-medium text-[#e6edf3]">{opp.name}</div>
              <div className="text-xs text-[#9ba4b0]">
                {oppDef.name} · {oppDef.hp} PV · {oppDef.passive.name}
              </div>
            </div>
            <RankBadge elo={1000} />
          </div>
        </Panel>

        {/* CTA */}
        <div className="flex justify-end">
          <Btn onClick={launch} size="lg">
            Lancer le duel
          </Btn>
        </div>
      </div>
    </div>
  );
}
