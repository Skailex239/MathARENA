"use client";

import { RankBadge } from "./ui";
import { divisionFor } from "@/lib/game/divisions";
import { cn } from "@/lib/utils";

interface PlayerPanelProps {
  name: string;
  elo: number;
  score: number;
  targetScore: number;
  combo: number;
  avgTimeMs: number; // 0 si aucune
  accuracy: number; // 0-100
  thinking?: boolean;
  side: "left" | "right";
  isMe?: boolean;
  shake?: boolean;
}

function comboColor(combo: number): string {
  if (combo >= 8) return "#3B82F6";
  if (combo >= 5) return "#F85149";
  if (combo >= 3) return "#D29922";
  return "#6E7681";
}

function fmtSpeed(ms: number): string {
  if (ms <= 0) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

export function PlayerPanel({
  name,
  elo,
  score,
  targetScore,
  combo,
  avgTimeMs,
  accuracy,
  thinking,
  side,
  isMe,
  shake,
}: PlayerPanelProps) {
  const isRight = side === "right";
  const div = divisionFor(elo);
  const pct = Math.min(100, (score / targetScore) * 100);
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "rounded-[10px] border border-[#2d333b] bg-[#161b22] p-5 flex flex-col gap-3 transition-transform",
        shake && "animate-shake",
      )}
    >
      {/* Avatar + nom + rang */}
      <div className={cn("flex items-center gap-2.5", isRight && "flex-row-reverse text-right")}>
        <div className="grid place-items-center w-9 h-9 rounded-full bg-[#1c2128] border border-[#2d333b] text-sm font-semibold text-[#e6edf3] shrink-0">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5" style={isRight ? { justifyContent: "flex-end" } : undefined}>
            <span className="text-base font-semibold text-[#e6edf3] truncate">{name}</span>
            {isMe && <span className="text-[9px] px-1 py-0.5 rounded bg-[#3b82f6] text-white font-semibold shrink-0">TOI</span>}
          </div>
          <div className={cn("flex items-center gap-1.5 text-[13px] text-[#9ba4b0]", isRight && "justify-end")}>
            <span style={{ color: div.color }}>{div.name}</span>
            <span className="text-[#6e7681]">·</span>
            <span className="font-mono">{elo} Elo</span>
          </div>
        </div>
      </div>

      {/* Score + barre progression (BLEUE toujours) */}
      <div>
        <div className={cn("flex items-baseline gap-1", isRight && "justify-end")}>
          <span className="font-mono font-bold text-2xl text-[#e6edf3]">{score}</span>
          <span className="font-mono text-sm text-[#6e7681]">/ {targetScore}</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-[#1c2128] overflow-hidden border border-[#232a33]">
          <div
            className="h-full rounded-full bg-[#3b82f6] transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Combo */}
      <div className={cn("flex items-center gap-1.5 text-sm", isRight && "justify-end")}>
        <span className="text-[#6e7681]">🔥</span>
        <span className="font-mono font-medium" style={{ color: comboColor(combo) }}>
          Combo x{combo}
        </span>
      </div>

      {/* Stats live */}
      <div className={cn("space-y-1 text-[13px]", isRight && "text-right")}>
        <div className={cn("flex items-center gap-2", isRight && "justify-end")}>
          <span className="text-[#6e7681]">⚡</span>
          <span className="text-[#9ba4b0]">Vitesse</span>
          <span className="font-mono text-[#e6edf3] ml-auto">{fmtSpeed(avgTimeMs)}</span>
        </div>
        <div className={cn("flex items-center gap-2", isRight && "justify-end")}>
          <span className="text-[#6e7681]">🎯</span>
          <span className="text-[#9ba4b0]">Précision</span>
          <span className="font-mono text-[#e6edf3] ml-auto">{accuracy > 0 ? `${accuracy}%` : "—"}</span>
        </div>
      </div>

      {/* Indicateur calcul adverse */}
      {thinking && (
        <div className={cn("flex items-center gap-1.5 text-xs text-[#9ba4b0]", isRight && "justify-end")}>
          <span className="flex gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
          <span>en train de calculer</span>
        </div>
      )}
    </div>
  );
}
