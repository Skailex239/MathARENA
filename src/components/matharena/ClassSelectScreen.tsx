"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { CLASS_LIST, CLASSES } from "@/lib/game/classes";
import type { ClassId, GameMode } from "@/lib/game/types";
import { Btn, Panel, SectionTitle } from "./ui";
import { cn } from "@/lib/utils";
import { Swords, RefreshCw, ArrowLeft, Zap, Shield, AlertTriangle } from "lucide-react";

const MODES: { id: GameMode; name: string; emoji: string; desc: string; accent: string; tag: string }[] = [
  { id: "RANKED", name: "Classé", emoji: "🏆", desc: "Impacte ton Elo. Difficulté adaptative.", accent: "#f59e0b", tag: "ELO" },
  { id: "QUICK", name: "Partie rapide", emoji: "⚡", desc: "Sans enjeu. 10s par question.", accent: "#22c55e", tag: "CHAUD" },
  { id: "BLITZ", name: "Blitz", emoji: "🔥", desc: "3s par question. Impacte l'Elo.", accent: "#ef4444", tag: "RAPIDE" },
  { id: "PRACTICE", name: "Entraînement", emoji: "🧠", desc: "Vs IA, sans Elo. Pour progresser.", accent: "#7c3aed", tag: "SOLO" },
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
    <div className="mx-auto max-w-6xl px-4 py-6 pb-28">
      <button
        onClick={() => setView("home")}
        className="flex items-center gap-1.5 text-sm text-[#8b949e] hover:text-white mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <SectionTitle className="text-3xl sm:text-4xl">Prépare ton duel</SectionTitle>
      <p className="text-[#8b949e] text-sm mb-6 mt-1">Choisis ta classe, ton mode et ton adversaire.</p>

      {/* Classes */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-3">1. Ta classe</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {CLASS_LIST.map((c) => {
            const active = c.id === cls;
            return (
              <button
                key={c.id}
                onClick={() => setCls(c.id)}
                className={cn(
                  "relative rounded-xl border p-4 text-left transition-all",
                  active
                    ? "bg-[rgba(37,99,235,0.08)] -translate-y-0.5"
                    : "bg-[#161b22] border-[#30363d] hover:border-[#484f58]",
                )}
                style={active ? { borderColor: c.color, boxShadow: `0 0 18px ${c.color}40` } : undefined}
              >
                <div className="text-3xl mb-1">{c.emoji}</div>
                <div className="font-display font-bold" style={{ color: active ? c.color : "#fff" }}>{c.name}</div>
                <div className="text-[11px] text-[#8b949e] font-mono">{c.hp} PV</div>
                {active && (
                  <motion.div
                    layoutId="class-active"
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#2563eb] grid place-items-center text-[10px] font-black text-white"
                  >
                    ✓
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        <Panel className="mt-3 p-4" style={{ borderColor: `${def.color}66` }}>
          <div className="flex items-start gap-3">
            <span className="text-4xl">{def.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-lg" style={{ color: def.color }}>{def.name}</h3>
                <span className="text-xs text-[#8b949e]">{def.tagline}</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 mt-3 text-sm">
                <div className="rounded-lg bg-[#21262d] p-2.5 border border-[#30363d]">
                  <div className="flex items-center gap-1.5 text-[#22c55e] text-xs font-semibold mb-0.5">
                    <Shield className="w-3.5 h-3.5" /> Passif
                  </div>
                  <div className="font-medium">{def.passive.name}</div>
                  <div className="text-xs text-[#8b949e]">{def.passive.description}</div>
                </div>
                <div className="rounded-lg bg-[#21262d] p-2.5 border border-[#30363d]">
                  <div className="flex items-center gap-1.5 text-[#f59e0b] text-xs font-semibold mb-0.5">
                    <Zap className="w-3.5 h-3.5" /> Ultime
                  </div>
                  <div className="font-medium">{def.ultimate.name}</div>
                  <div className="text-xs text-[#8b949e]">{def.ultimate.description}</div>
                </div>
                <div className="rounded-lg bg-[#21262d] p-2.5 border border-[#30363d]">
                  <div className="flex items-center gap-1.5 text-[#ef4444] text-xs font-semibold mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Faiblesse
                  </div>
                  <div className="text-xs">{def.weakness}</div>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </section>

      {/* Mode */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-3">2. Mode de jeu</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MODES.map((m) => {
            const active = m.id === mode;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  active ? "bg-[rgba(37,99,235,0.1)] -translate-y-0.5" : "bg-[#161b22] border-[#30363d] hover:border-[#484f58]",
                )}
                style={active ? { borderColor: "#2563eb", boxShadow: "0 0 18px rgba(37,99,235,0.35)" } : undefined}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{ color: m.accent, background: `${m.accent}1f`, border: `1px solid ${m.accent}55` }}>
                    {m.tag}
                  </span>
                </div>
                <div className="font-display font-bold" style={{ color: active ? "#2563eb" : m.accent }}>{m.name}</div>
                <div className="text-xs text-[#8b949e] mt-0.5">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Adversaire */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">3. Ton adversaire</h2>
          <button
            onClick={() => setOpp(randomOpponent(opp.name))}
            className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#00d4ff]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Changer
          </button>
        </div>
        <Panel className="p-4 flex items-center gap-4">
          <div
            className="clip-hex grid place-items-center w-16 h-16 text-3xl"
            style={{ background: `linear-gradient(135deg, ${oppDef.color}40, ${oppDef.color}10)`, border: `1px solid ${oppDef.color}` }}
          >
            {oppDef.emoji}
          </div>
          <div>
            <div className="font-display font-bold text-lg">{opp.name}</div>
            <div className="text-sm" style={{ color: oppDef.color }}>{oppDef.name} · {oppDef.hp} PV</div>
            <div className="text-xs text-[#8b949e] mt-0.5">Passif : {oppDef.passive.name}</div>
          </div>
        </Panel>
      </section>

      {/* Lancement sticky */}
      <div className="sticky bottom-3 z-30">
        <Btn onClick={launch} size="lg" className="w-full text-lg font-display">
          <Swords className="w-5 h-5" /> Entrer dans l'arène
        </Btn>
      </div>
    </div>
  );
}
