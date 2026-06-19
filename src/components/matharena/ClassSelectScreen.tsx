"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { CLASS_LIST, ACCENT_CLASSES, CLASSES } from "@/lib/game/classes";
import type { ClassId, GameMode } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Swords, RefreshCw, ArrowLeft, Zap, Shield, AlertTriangle } from "lucide-react";

const MODES: { id: GameMode; name: string; emoji: string; desc: string; accent: string }[] = [
  { id: "RANKED", name: "Classé", emoji: "🏆", desc: "Impacte ton Elo. Difficulté adaptative.", accent: "text-[#ffb02e]" },
  { id: "QUICK", name: "Partie rapide", emoji: "⚡", desc: "Sans enjeu. 10s par question.", accent: "text-[#3ddc84]" },
  { id: "BLITZ", name: "Blitz", emoji: "🔥", desc: "3s par question. Impacte l'Elo.", accent: "text-[#f44747]" },
  { id: "PRACTICE", name: "Entraînement", emoji: "🧠", desc: "Vs IA, sans Elo. Pour progresser.", accent: "text-[#b15cff]" },
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
  const accent = ACCENT_CLASSES[def.accent];

  const launch = () => {
    setSelection(cls, mode);
    setOpponent(opp.classId, opp.name);
    setView("duel");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-28">
      <button
        onClick={() => setView("home")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <h1 className="text-3xl sm:text-4xl font-black mb-1">Prépare ton duel</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Choisis ta classe, ton mode et ton adversaire.
      </p>

      {/* Classes */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          1. Ta classe
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {CLASS_LIST.map((c) => {
            const a = ACCENT_CLASSES[c.accent];
            const active = c.id === cls;
            return (
              <button
                key={c.id}
                onClick={() => setCls(c.id)}
                className={cn(
                  "relative rounded-2xl border bg-gradient-to-b p-4 text-left transition-all",
                  active
                    ? cn(a.border, a.from, a.to, "scale-[1.03]", a.glow)
                    : "border-border/50 bg-card/40 hover:border-border",
                )}
              >
                <div className="text-3xl mb-1">{c.emoji}</div>
                <div className={cn("font-bold", active ? a.text : "text-foreground")}>{c.name}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{c.hp} PV</div>
                {active && (
                  <motion.div
                    layoutId="class-active"
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#ff3d8b] grid place-items-center text-[10px] font-black text-white"
                  >
                    ✓
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        {/* détail classe */}
        <div className={cn("mt-3 rounded-2xl border p-4", accent.border, "bg-card/40")}>
          <div className="flex items-start gap-3">
            <span className="text-4xl">{def.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={cn("font-bold text-lg", accent.text)}>{def.name}</h3>
                <span className="text-xs text-muted-foreground">{def.tagline}</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 mt-3 text-sm">
                <div className="rounded-lg bg-black/30 p-2.5">
                  <div className="flex items-center gap-1.5 text-[#3ddc84] text-xs font-semibold mb-0.5">
                    <Shield className="w-3.5 h-3.5" /> Passif
                  </div>
                  <div className="font-medium">{def.passive.name}</div>
                  <div className="text-xs text-muted-foreground">{def.passive.description}</div>
                </div>
                <div className="rounded-lg bg-black/30 p-2.5">
                  <div className="flex items-center gap-1.5 text-[#ffb02e] text-xs font-semibold mb-0.5">
                    <Zap className="w-3.5 h-3.5" /> Ultime
                  </div>
                  <div className="font-medium">{def.ultimate.name}</div>
                  <div className="text-xs text-muted-foreground">{def.ultimate.description}</div>
                </div>
                <div className="rounded-lg bg-black/30 p-2.5">
                  <div className="flex items-center gap-1.5 text-[#f44747] text-xs font-semibold mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Faiblesse
                  </div>
                  <div className="text-xs">{def.weakness}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mode */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          2. Mode de jeu
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MODES.map((m) => {
            const active = m.id === mode;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all",
                  active
                    ? "border-[#ff3d8b] bg-[#ff3d8b]/10 box-glow-magenta"
                    : "border-border/50 bg-card/40 hover:border-border",
                )}
              >
                <div className="text-2xl mb-1">{m.emoji}</div>
                <div className={cn("font-bold", active ? "text-[#ff3d8b]" : m.accent)}>{m.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Adversaire */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            3. Ton adversaire
          </h2>
          <button
            onClick={() => setOpp(randomOpponent(opp.name))}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#ff3d8b]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Changer
          </button>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card/40 p-4 flex items-center gap-4">
          <div
            className="clip-hex grid place-items-center w-16 h-16 text-3xl"
            style={{
              background: `linear-gradient(135deg, ${oppDef.color}55, ${oppDef.color}11)`,
              border: `1px solid ${oppDef.color}`,
            }}
          >
            {oppDef.emoji}
          </div>
          <div>
            <div className="font-bold text-lg">{opp.name}</div>
            <div className="text-sm" style={{ color: oppDef.color }}>
              {oppDef.name} · {oppDef.hp} PV
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Passif : {oppDef.passive.name}
            </div>
          </div>
        </div>
      </section>

      {/* Lancement */}
      <div className="sticky bottom-3 z-30">
        <Button
          onClick={launch}
          size="lg"
          className="w-full h-14 text-lg bg-[#ff3d8b] hover:bg-[#ff3d8b]/85 text-white font-black box-glow-magenta"
        >
          <Swords className="w-5 h-5 mr-2" /> Entrer dans l'arène
        </Button>
      </div>
    </div>
  );
}
