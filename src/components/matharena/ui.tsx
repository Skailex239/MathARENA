"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { divisionFor } from "@/lib/game/divisions";

/* ----------------------------------------------------------------
   Btn — boutons spec (primary / secondary / danger / ghost)
   ---------------------------------------------------------------- */
type BtnVariant = "primary" | "secondary" | "danger" | "ghost";
type BtnSize = "sm" | "md" | "lg";

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-md select-none disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary:
    "bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-[0_0_0_1px_rgba(37,99,235,0.4),0_6px_20px_-6px_rgba(37,99,235,0.6)] hover:shadow-[0_0_0_1px_rgba(37,99,235,0.6),0_10px_28px_-6px_rgba(37,99,235,0.7)] hover:-translate-y-0.5 active:translate-y-0",
  secondary:
    "bg-transparent border border-[#30363d] text-white hover:bg-[#21262d] hover:border-[#484f58]",
  danger:
    "bg-[rgba(239,68,68,0.1)] border border-[#ef4444] text-[#ef4444] hover:bg-[rgba(239,68,68,0.18)]",
  ghost: "bg-transparent text-[#8b949e] hover:text-white hover:bg-[#21262d]",
};

const BTN_SIZE: Record<BtnSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-7 text-base",
};

export interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
}
export const Btn = React.forwardRef<HTMLButtonElement, BtnProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button ref={ref} className={cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)} {...props} />
  ),
);
Btn.displayName = "Btn";

/* ----------------------------------------------------------------
   Panel — carte spec (#161B22, border #30363D, radius 12)
   ---------------------------------------------------------------- */
export function Panel({
  className,
  children,
  hover,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "bg-[#161b22] border border-[#30363d] rounded-xl",
        hover &&
          "transition-all duration-200 hover:border-[rgba(37,99,235,0.6)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(37,99,235,0.4)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------
   SectionTitle — titres de section (Syne)
   ---------------------------------------------------------------- */
export function SectionTitle({
  children,
  className,
  as: As = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <As className={cn("font-display font-extrabold tracking-tight text-white", className)}>
      {children}
    </As>
  );
}

/* ----------------------------------------------------------------
   StatTile — tuile statistique compacte
   ---------------------------------------------------------------- */
export function StatTile({
  label,
  value,
  sub,
  accent,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
  className?: string;
}) {
  return (
    <Panel className={cn("p-4", className)}>
      <div className="text-[11px] uppercase tracking-wider text-[#8b949e] font-medium">{label}</div>
      <div className={cn("mt-1 font-mono font-bold text-2xl", accent ?? "text-white")}>{value}</div>
      {sub && <div className="text-xs text-[#8b949e] mt-0.5">{sub}</div>}
    </Panel>
  );
}

/* ----------------------------------------------------------------
   HealthBar — barre PV (vert >60% / ambre 30-60% / rouge <30% + pulse)
   ---------------------------------------------------------------- */
export function HealthBar({
  hp,
  maxHp,
  shield = 0,
  className,
}: {
  hp: number;
  maxHp: number;
  shield?: number;
  className?: string;
}) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const color = pct > 60 ? "#22c55e" : pct > 30 ? "#f59e0b" : "#ef4444";
  const low = pct <= 30 && pct > 0;
  return (
    <div className={cn("relative h-4 rounded-full bg-[#21262d] overflow-hidden border border-[#30363d]", className)}>
      <div
        className={cn("absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out", low && "animate-pulse-danger")}
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 12px ${color}99` }}
      />
      {shield > 0 && (
        <div
          className="absolute inset-y-0 left-0 bg-white/45 border-r-2 border-white/70"
          style={{ width: `${Math.min(100, (shield / maxHp) * 100 + pct)}%` }}
        />
      )}
      <div className="absolute inset-0 grid place-items-center text-[10px] font-mono font-bold text-white drop-shadow">
        {Math.ceil(hp)} / {maxHp}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   EnergyBar — barre d'énergie (bleu→cyan)
   ---------------------------------------------------------------- */
export function EnergyBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("relative h-2 rounded-full bg-[#21262d] overflow-hidden border border-[#30363d]", className)}>
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: "linear-gradient(90deg, #2563eb, #00d4ff)",
          boxShadow: "0 0 10px rgba(0,212,255,0.4)",
        }}
      />
    </div>
  );
}

/* ----------------------------------------------------------------
   ComboBadge — badge combo (scale + glow)
   ---------------------------------------------------------------- */
export function ComboBadge({ mult, active }: { mult: number; active: boolean }) {
  if (!active) return null;
  const color = mult >= 3 ? "#ff0080" : mult >= 2 ? "#7c3aed" : "#f59e0b";
  return (
    <div
      className="rounded-lg px-2 py-1 text-center border font-black leading-none"
      style={{
        color,
        borderColor: `${color}99`,
        background: `${color}1f`,
        boxShadow: `0 0 16px ${color}55`,
      }}
    >
      <div className="text-base">x{mult}</div>
      <div className="text-[9px] font-semibold text-[#8b949e]">COMBO</div>
    </div>
  );
}

/* ----------------------------------------------------------------
   RankBadge — badge rang (pill, uppercase, color @ 20% bg / 60% border)
   ---------------------------------------------------------------- */
export function RankBadge({ elo, className }: { elo: number; className?: string }) {
  const d = divisionFor(elo);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap",
        className,
      )}
      style={{
        color: d.color,
        background: `${d.color}33`,
        borderColor: `${d.color}99`,
      }}
    >
      <span className="text-xs leading-none">{d.emoji}</span>
      {d.name}
    </span>
  );
}

/* ----------------------------------------------------------------
   AnswerInput — champ réponse (flash vert correct / rouge+shake incorrect)
   Géré inline dans DuelScreen pour contrôle fin des états.
   ---------------------------------------------------------------- */
