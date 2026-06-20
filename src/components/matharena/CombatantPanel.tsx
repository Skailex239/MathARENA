"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Combatant } from "@/lib/game/types";
import { CLASSES } from "@/lib/game/classes";
import { HealthBar, EnergyBar, ComboBadge, RankBadge } from "./ui";
import { cn } from "@/lib/utils";

interface Props {
  combatant: Combatant;
  name: string;
  elo: number;
  side: "player" | "opponent";
  thinking?: boolean;
  isMe?: boolean;
  shake?: boolean;
  redFlash?: boolean;
}

const STATUS_BADGES: {
  key: keyof Combatant;
  emoji: string;
  label: string;
  show: (c: Combatant) => boolean;
  val?: (c: Combatant) => number;
}[] = [
  { key: "shield", emoji: "🛡️", label: "Bouclier", show: (c) => c.shield > 0, val: (c) => c.shield },
  { key: "wallCharges", emoji: "🧱", label: "Mur", show: (c) => c.wallCharges > 0, val: (c) => c.wallCharges },
  { key: "burnTurns", emoji: "🔥", label: "Brûlure", show: (c) => c.burnTurns > 0, val: (c) => c.burnTurns },
  { key: "poisonTurns", emoji: "☠️", label: "Poison", show: (c) => c.poisonTurns > 0, val: (c) => c.poisonTurns },
  { key: "mirrorActive", emoji: "🪞", label: "Miroir", show: (c) => c.mirrorActive },
  { key: "fireBoost", emoji: "💢", label: "Feu", show: (c) => c.fireBoost },
  { key: "confusedTurns", emoji: "🌀", label: "Confus", show: (c) => c.confusedTurns > 0, val: (c) => c.confusedTurns },
  { key: "slowTurns", emoji: "❄️", label: "Gelé", show: (c) => c.slowTurns > 0, val: (c) => c.slowTurns },
];

export function CombatantPanel({
  combatant,
  name,
  elo,
  side,
  thinking,
  isMe,
  shake,
  redFlash,
}: Props) {
  const def = CLASSES[combatant.classId];
  const hpPct = (combatant.hp / combatant.maxHp) * 100;
  const comboMult =
    combatant.combo >= 8 ? 3 : combatant.combo >= def.x2Threshold ? 2 : combatant.combo >= 3 ? 1.5 : 1;
  const comboActive = combatant.combo >= 3;
  const ultReady = combatant.combo >= 10;
  const spellReady = combatant.combo >= 8;
  const isOpp = side === "opponent";

  return (
    <div
      className={cn(
        "relative rounded-xl border border-[#30363d] bg-[#161b22] p-3 sm:p-4 transition-colors",
        isOpp && "sm:text-right",
        redFlash && "animate-flash-red",
      )}
    >
      {/* en-tête */}
      <div className={cn("flex items-center gap-3", isOpp && "sm:flex-row-reverse")}>
        <div className="relative shrink-0">
          <motion.div
            className={cn("clip-hex grid place-items-center w-14 h-14 sm:w-16 sm:h-16 text-3xl", thinking && "animate-pulse-blue")}
            style={{
              background: `linear-gradient(135deg, ${def.color}40, ${def.color}10)`,
              border: `1px solid ${def.color}`,
            }}
            animate={shake ? { x: [0, -5, 5, 0] } : {}}
            transition={{ duration: 0.35 }}
          >
            <span>{def.emoji}</span>
          </motion.div>
          {thinking && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-[#0d1117] px-1.5 rounded-full border border-[#30363d] whitespace-nowrap">
              réfléchit…
            </span>
          )}
        </div>

        <div className={cn("min-w-0 flex-1", isOpp && "sm:text-right")}>
          <div className="flex items-center gap-2 flex-wrap" style={isOpp ? { justifyContent: "flex-end" } : undefined}>
            <span className="font-semibold truncate">{name}</span>
            {isMe && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2563eb] text-white font-bold">TOI</span>
            )}
          </div>
          <div className={cn("flex items-center gap-1.5 flex-wrap mt-0.5", isOpp && "sm:justify-end")}>
            <span className="text-xs" style={{ color: def.color }}>{def.name}</span>
            <RankBadge elo={elo} />
          </div>
        </div>

        <div className="shrink-0">
          <AnimatePresence mode="popLayout">
            {comboActive && (
              <motion.div
                key={comboMult}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
              >
                <ComboBadge mult={comboMult} active />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* HP */}
      <div className="mt-3">
        <HealthBar hp={combatant.hp} maxHp={combatant.maxHp} shield={combatant.shield} />
      </div>

      {/* Énergie */}
      <div className="mt-2 flex items-center gap-2">
        {!isOpp && <span className="text-[10px] text-[#8b949e] w-12 shrink-0">ÉNERGIE</span>}
        <EnergyBar value={combatant.energy} className="flex-1" />
        <span className="text-[10px] font-mono w-7 text-right shrink-0 text-[#8b949e]">{combatant.energy}</span>
        {isOpp && <span className="text-[10px] text-[#8b949e] w-12 shrink-0 text-right">ÉNERGIE</span>}
      </div>

      {/* Statuts + dispo */}
      <div className={cn("mt-2 flex flex-wrap gap-1.5", isOpp && "sm:justify-end")}>
        {STATUS_BADGES.filter((b) => b.show(combatant)).map((b) => (
          <span
            key={b.key as string}
            className="text-[10px] px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d]"
            title={b.label}
          >
            {b.emoji}
            {b.val ? `×${b.val(combatant)}` : ""}
          </span>
        ))}
        {side === "player" && (
          <>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded border",
                spellReady ? "border-[#7c3aed] text-[#7c3aed]" : "border-[#30363d] text-[#484f58]",
              )}
            >
              🔮 Sorts
            </span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded border",
                ultReady ? "border-[#ff0080] text-[#ff0080] glow-purple" : "border-[#30363d] text-[#484f58]",
              )}
            >
              ⚡ Ultime
            </span>
          </>
        )}
      </div>
    </div>
  );
}
