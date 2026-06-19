"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Combatant } from "@/lib/game/types";
import { CLASSES, ACCENT_CLASSES } from "@/lib/game/classes";
import { cn } from "@/lib/utils";

interface Props {
  combatant: Combatant;
  name: string;
  side: "player" | "opponent";
  thinking?: boolean;
  isMe?: boolean;
  flash?: "hit" | "crit" | "miss" | "heal" | null;
}

function hpColor(pct: number): string {
  if (pct > 60) return "#3ddc84"; // emerald
  if (pct > 30) return "#ffb02e"; // amber
  return "#f44747"; // red
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
  side,
  thinking,
  isMe,
  flash,
}: Props) {
  const def = CLASSES[combatant.classId];
  const accent = ACCENT_CLASSES[def.accent];
  const hpPct = Math.max(0, (combatant.hp / combatant.maxHp) * 100);
  const energyPct = combatant.energy;
  const comboMult =
    combatant.combo >= 8 ? 3 : combatant.combo >= def.x2Threshold ? 2 : combatant.combo >= 3 ? 1.5 : 1;
  const comboActive = combatant.combo >= 3;
  const ultReady = combatant.combo >= 10;
  const spellReady = combatant.combo >= 8;

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-card/70 backdrop-blur p-3 sm:p-4 transition-colors",
        accent.border,
        side === "opponent" && "sm:text-right",
        flash === "hit" && "animate-flash",
      )}
    >
      {/* en-tête : avatar + identité */}
      <div
        className={cn(
          "flex items-center gap-3",
          side === "opponent" && "sm:flex-row-reverse",
        )}
      >
        <div className="relative shrink-0">
          <motion.div
            className={cn(
              "clip-hex grid place-items-center w-14 h-14 sm:w-16 sm:h-16 text-3xl sm:text-4xl",
              accent.glow,
              thinking && "animate-pulse-glow",
            )}
            style={{
              background: `linear-gradient(135deg, ${def.color}55, ${def.color}11)`,
              border: `1px solid ${def.color}`,
            }}
            animate={
              flash === "crit"
                ? { scale: [1, 1.12, 1] }
                : flash === "miss"
                  ? { x: [0, -5, 5, 0] }
                  : {}
            }
            transition={{ duration: 0.35 }}
          >
            <span>{def.emoji}</span>
          </motion.div>
          {thinking && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-background/80 px-1.5 rounded-full border border-border whitespace-nowrap">
              réfléchit…
            </span>
          )}
        </div>

        <div className={cn("min-w-0 flex-1", side === "opponent" && "sm:text-right")}>
          <div className="flex items-center gap-2 flex-wrap" style={side === "opponent" ? { justifyContent: "flex-end" } : undefined}>
            <span className="font-bold truncate text-sm sm:text-base">{name}</span>
            {isMe && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
                TOI
              </span>
            )}
          </div>
          <div className={cn("flex items-center gap-1.5 text-xs", accent.text, side === "opponent" && "sm:justify-end")}>
            <span>{def.name}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{combatant.hp}/{combatant.maxHp} PV</span>
          </div>
        </div>

        {/* combo badge */}
        <div className="shrink-0">
          <AnimatePresence mode="popLayout">
            {comboActive && (
              <motion.div
                key={comboMult}
                initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.6, opacity: 0 }}
                className={cn(
                  "rounded-xl px-2 py-1 text-center border font-black leading-none",
                  comboMult >= 3
                    ? "border-[#ff3d8b] text-[#ff3d8b] box-glow-magenta"
                    : comboMult >= 2
                      ? "border-[#b15cff] text-[#b15cff]"
                      : "border-[#ffb02e] text-[#ffb02e]",
                )}
              >
                <div className="text-base sm:text-lg">x{comboMult}</div>
                <div className="text-[9px] font-medium text-muted-foreground">COMBO</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* barre PV */}
      <div className="mt-3">
        <div className="relative h-4 sm:h-5 rounded-full bg-black/40 overflow-hidden border border-border/60">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: `linear-gradient(90deg, ${hpColor(hpPct)}, ${hpColor(hpPct)}cc)` }}
            animate={{ width: `${hpPct}%` }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
          />
          {combatant.shield > 0 && (
            <div
              className="absolute inset-y-0 left-0 bg-white/40 border-r-2 border-white/70"
              style={{ width: `${Math.min(100, (combatant.shield / combatant.maxHp) * 100 + hpPct)}%` }}
            />
          )}
          <div className="absolute inset-0 grid place-items-center text-[10px] font-mono font-bold">
            {Math.ceil(combatant.hp)} / {combatant.maxHp}
          </div>
        </div>
      </div>

      {/* barre énergie */}
      <div className="mt-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-12 shrink-0">ÉNERGIE</span>
          <div className="relative flex-1 h-2 rounded-full bg-black/40 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: "linear-gradient(90deg, #ffb02e, #ff3d8b)" }}
              animate={{ width: `${energyPct}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 28 }}
            />
          </div>
          <span className="text-[10px] font-mono w-8 text-right shrink-0">{energyPct}</span>
        </div>
      </div>

      {/* badges de statut + disponibilités */}
      <div className={cn("mt-2 flex flex-wrap gap-1.5", side === "opponent" && "sm:justify-end")}>
        {STATUS_BADGES.filter((b) => b.show(combatant)).map((b) => (
          <span
            key={b.key as string}
            className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/40 border border-border/60"
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
                "text-[10px] px-1.5 py-0.5 rounded-md border",
                spellReady ? "border-[#b15cff] text-[#b15cff]" : "border-border/40 text-muted-foreground",
              )}
            >
              🔮 Sorts
            </span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md border",
                ultReady ? "border-[#ff3d8b] text-[#ff3d8b] box-glow-magenta" : "border-border/40 text-muted-foreground",
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
