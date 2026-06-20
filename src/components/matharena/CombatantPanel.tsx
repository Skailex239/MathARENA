"use client";

import type { Combatant } from "@/lib/game/types";
import { CLASSES } from "@/lib/game/classes";
import { HealthBar, EnergyBar, RankBadge } from "./ui";
import { cn } from "@/lib/utils";

interface Props {
  combatant: Combatant;
  name: string;
  elo: number;
  side: "player" | "opponent";
  thinking?: boolean;
  isMe?: boolean;
  shake?: boolean;
}

const STATUS: { key: keyof Combatant; emoji: string; label: string; show: (c: Combatant) => boolean; val?: (c: Combatant) => number }[] = [
  { key: "shield", emoji: "⛨", label: "Bouclier", show: (c) => c.shield > 0, val: (c) => c.shield },
  { key: "wallCharges", emoji: "▦", label: "Mur", show: (c) => c.wallCharges > 0, val: (c) => c.wallCharges },
  { key: "burnTurns", emoji: "🔥", label: "Brûlure", show: (c) => c.burnTurns > 0, val: (c) => c.burnTurns },
  { key: "poisonTurns", emoji: "☠", label: "Poison", show: (c) => c.poisonTurns > 0, val: (c) => c.poisonTurns },
  { key: "mirrorActive", emoji: "↺", label: "Miroir", show: (c) => c.mirrorActive },
  { key: "fireBoost", emoji: "✦", label: "Feu", show: (c) => c.fireBoost },
  { key: "confusedTurns", emoji: "↯", label: "Confus", show: (c) => c.confusedTurns > 0, val: (c) => c.confusedTurns },
  { key: "slowTurns", emoji: "❄", label: "Gelé", show: (c) => c.slowTurns > 0, val: (c) => c.slowTurns },
];

const CLASS_ICON: Record<string, string> = {
  guerrier: "⚔", mage: "✦", gardien: "⛨", assassin: "✕", alchimiste: "⚗",
};

export function CombatantPanel({ combatant, name, elo, side, thinking, isMe, shake }: Props) {
  const def = CLASSES[combatant.classId];
  const comboMult =
    combatant.combo >= 8 ? 3 : combatant.combo >= def.x2Threshold ? 2 : combatant.combo >= 3 ? 1.5 : 1;
  const comboActive = combatant.combo >= 3;
  const isOpp = side === "opponent";

  return (
    <div className={cn("rounded-lg border border-[#2d333b] bg-[#161b22] p-3", shake && "animate-shake")}>
      {/* En-tête */}
      <div className={cn("flex items-center gap-2.5", isOpp && "flex-row-reverse text-right")}>
        <div className="grid place-items-center w-9 h-9 rounded-md bg-[#1c2128] border border-[#2d333b] text-lg text-[#e6edf3] shrink-0">
          {CLASS_ICON[combatant.classId]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5" style={isOpp ? { justifyContent: "flex-end" } : undefined}>
            <span className="text-sm font-medium text-[#e6edf3] truncate">{name}</span>
            {isMe && <span className="text-[9px] px-1 py-0.5 rounded bg-[#3b82f6] text-white font-semibold">TOI</span>}
          </div>
          <div className={cn("flex items-center gap-1.5 text-xs text-[#9ba4b0]", isOpp && "justify-end")}>
            <span>{def.name}</span>
            <span className="text-[#6e7681]">·</span>
            <RankBadge elo={elo} />
          </div>
        </div>
        {comboActive && (
          <div className="shrink-0 font-mono text-sm font-semibold text-[#3b82f6]">
            x{comboMult}
          </div>
        )}
      </div>

      {/* HP */}
      <div className="mt-2.5 flex items-center gap-2">
        {!isOpp && <span className="text-[10px] font-mono text-[#6e7681] w-6 shrink-0">HP</span>}
        <HealthBar hp={combatant.hp} maxHp={combatant.maxHp} shield={combatant.shield} className="flex-1" />
        <span className="font-mono text-[11px] text-[#9ba4b0] w-14 text-right shrink-0">
          {Math.ceil(combatant.hp)}/{combatant.maxHp}
        </span>
        {isOpp && <span className="text-[10px] font-mono text-[#6e7681] w-6 shrink-0">HP</span>}
      </div>

      {/* Énergie */}
      <div className="mt-1.5 flex items-center gap-2">
        {!isOpp && <span className="text-[10px] font-mono text-[#6e7681] w-6 shrink-0">EN</span>}
        <EnergyBar value={combatant.energy} className="flex-1" />
        <span className="font-mono text-[11px] text-[#9ba4b0] w-14 text-right shrink-0">
          {combatant.energy}/100
        </span>
        {isOpp && <span className="text-[10px] font-mono text-[#6e7681] w-6 shrink-0">EN</span>}
      </div>

      {/* Statuts */}
      <div className={cn("mt-2 flex flex-wrap gap-1", isOpp && "justify-end")}>
        {STATUS.filter((s) => s.show(combatant)).map((s) => (
          <span
            key={s.key as string}
            className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c2128] border border-[#2d333b] text-[#9ba4b0] font-mono"
            title={s.label}
          >
            {s.emoji}{s.val ? `×${s.val(combatant)}` : ""}
          </span>
        ))}
        {thinking && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c2128] border border-[#2d333b] text-[#9ba4b0]">
            …réflexion
          </span>
        )}
      </div>
    </div>
  );
}
